<?php

namespace Tests\Unit;

use App\Services\EbayNotificationVerifier;
use Tests\TestCase;

class EbayNotificationVerifierTest extends TestCase
{
    // Sabit test EC anahtar çifti (prime256v1) — keygen ortam openssl.cnf'e
    // bağlı olduğundan gömülü kullanılır; imzalama/doğrulama config gerektirmez.
    private const PRIVATE_PEM = <<<PEM
        -----BEGIN EC PRIVATE KEY-----
        MHcCAQEEID2CPBbDqj6YggfCKtqyFueK9T6y2//jJgRbQ07iiSd4oAoGCCqGSM49
        AwEHoUQDQgAEPoVlHS6j18KoT8oM2hivilJO9htfacQIYmdeDkkbDofEeN8QE6Y8
        gneucHDdIbCzGmQTPHWhErvYnYcEkM2/AQ==
        -----END EC PRIVATE KEY-----
        PEM;

    private const PUBLIC_PEM = <<<PEM
        -----BEGIN PUBLIC KEY-----
        MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPoVlHS6j18KoT8oM2hivilJO9htf
        acQIYmdeDkkbDofEeN8QE6Y8gneucHDdIbCzGmQTPHWhErvYnYcEkM2/AQ==
        -----END PUBLIC KEY-----
        PEM;

    // İkinci (saldırgan) anahtar için farklı bir çift türetmek yerine,
    // geçersizlik testinde imzayı bozmak yeterli.

    private function pem(string $raw): string
    {
        // Heredoc girintisini temizle.
        return implode("\n", array_map('trim', explode("\n", trim($raw)))) . "\n";
    }

    /**
     * Public key çözümünü sabit anahtarla değiştiren test sürümü —
     * kripto doğrulama ağa/eBay'e ihtiyaç duymadan test edilir.
     */
    private function verifierWithKey(string $publicKeyPem): EbayNotificationVerifier
    {
        return new class($publicKeyPem) extends EbayNotificationVerifier {
            public function __construct(private string $pem) {}

            protected function resolvePublicKey(string $keyId): ?string
            {
                return $this->pem;
            }
        };
    }

    private function buildSignatureHeader(string $body, string $digest = 'SHA1'): string
    {
        $algo       = $digest === 'SHA256' ? OPENSSL_ALGO_SHA256 : OPENSSL_ALGO_SHA1;
        $privateKey = openssl_pkey_get_private($this->pem(self::PRIVATE_PEM));
        openssl_sign($body, $signature, $privateKey, $algo);

        return base64_encode(json_encode([
            'alg'       => 'ecdsa',
            'kid'       => 'test-key-id',
            'signature' => base64_encode($signature),
            'digest'    => $digest,
        ]));
    }

    public function test_gecerli_imza_dogrulanir(): void
    {
        $body   = '{"metadata":{"topic":"order.created"},"resource":{"orderId":"123"}}';
        $header = $this->buildSignatureHeader($body);

        $this->assertTrue($this->verifierWithKey($this->pem(self::PUBLIC_PEM))->verify($header, $body));
    }

    public function test_sha256_digest_dogrulanir(): void
    {
        $body   = '{"topic":"account.deletion"}';
        $header = $this->buildSignatureHeader($body, 'SHA256');

        $this->assertTrue($this->verifierWithKey($this->pem(self::PUBLIC_PEM))->verify($header, $body));
    }

    public function test_kurcalanmis_govde_reddedilir(): void
    {
        $body   = '{"orderId":"123"}';
        $header = $this->buildSignatureHeader($body);

        // Gövde imzalandıktan sonra değiştirilirse doğrulama başarısız olmalı.
        $this->assertFalse($this->verifierWithKey($this->pem(self::PUBLIC_PEM))->verify($header, '{"orderId":"999"}'));
    }

    public function test_bozuk_imza_reddedilir(): void
    {
        $body   = '{"orderId":"123"}';
        $header = base64_encode(json_encode([
            'alg'       => 'ecdsa',
            'kid'       => 'test-key-id',
            'signature' => base64_encode('sahte-imza-baytlari'),
            'digest'    => 'SHA1',
        ]));

        $this->assertFalse($this->verifierWithKey($this->pem(self::PUBLIC_PEM))->verify($header, $body));
    }

    public function test_bozuk_header_reddedilir(): void
    {
        $verifier = $this->verifierWithKey($this->pem(self::PUBLIC_PEM));

        $this->assertFalse($verifier->verify('not-base64-json!!!', '{}'));
        $this->assertFalse($verifier->verify(base64_encode('{"no":"kid"}'), '{}'));
    }
}
