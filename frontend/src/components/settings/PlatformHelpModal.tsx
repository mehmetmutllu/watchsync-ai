'use client';

import { X, ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react';

interface PlatformHelpModalProps {
  platformName: string;
  onClose: () => void;
}

const HELP_DATA: Record<string, { title: string; steps: { title: string; desc: string; link?: string }[]; tips: string[] }> = {
  eBay: {
    title: 'eBay Bağlantı Rehberi',
    steps: [
      {
        title: '1. eBay Developer Hesabı Oluşturun',
        desc: 'eBay Developer Program\'a kaydolun ve bir uygulama oluşturun. Sandbox veya Production ortamını seçin.',
        link: 'https://developer.ebay.com',
      },
      {
        title: '2. Application Oluşturun',
        desc: 'Developer Dashboard\'da "Create Application" ile yeni bir uygulama oluşturun. Application Type olarak "Trading API" seçin.',
      },
      {
        title: '3. OAuth Redirect URI Ayarlayın',
        desc: 'Uygulama ayarlarında OAuth Redirect URI olarak WatchSync AI\'ın callback URL\'ini girin. Bu, ayarlar sayfasında otomatik olarak yapılandırılmıştır.',
      },
      {
        title: '4. "eBay\'e Bağlan" Butonuna Tıklayın',
        desc: 'Platform kartındaki bağlan butonuna tıklayın. eBay yetkilendirme sayfası açılacak ve hesabınızı yetkilendirmenizi isteyecektir.',
      },
      {
        title: '5. Sandbox\'ta Test Edin',
        desc: 'Önce Sandbox ortamında test edin. Test saatleri oluşturun ve senkronizasyonu kontrol edin. Her şey çalıştığında Production\'a geçin.',
      },
    ],
    tips: [
      'OAuth token\'ları otomatik olarak yenilenir, manuel müdahale gerekmez.',
      'eBay API çağrı limitleri vardır — günlük 5000 çağrı (Production).',
      'Listing\'ler eBay\'in onay sürecinden geçer, bu 24 saate kadar sürebilir.',
    ],
  },
  Chrono24: {
    title: 'Chrono24 Bağlantı Rehberi',
    steps: [
      {
        title: '1. Chrono24 Dealer Başvurusu',
        desc: 'Chrono24\'te profesyonel satıcı (dealer) hesabınızın olması gerekir. Henüz yoksa başvuru yapın.',
        link: 'https://www.chrono24.com/dealer/',
      },
      {
        title: '2. API Erişimi Talep Edin',
        desc: 'Chrono24 müşteri hizmetleri ile iletişime geçerek API erişimi talep edin. Size API anahtarı ve secret verilecektir.',
      },
      {
        title: '3. IP Whitelist Bildirin',
        desc: 'Sunucunuzun IP adresini Chrono24\'e bildirin. Chrono24, XML feed\'inizi yalnızca whitelist\'teki IP adreslerinden çeker.',
      },
      {
        title: '4. API Anahtarlarını Girin',
        desc: 'Aldığınız API anahtarı ve secret\'i platform kartındaki forma girin ve kaydedin.',
      },
      {
        title: '5. XML Feed URL\'ini Paylaşın',
        desc: 'WatchSync AI otomatik olarak XML feed oluşturur. Feed URL\'ini Chrono24 destek ekibine gönderin. Feed periyodik olarak çekilecektir.',
      },
    ],
    tips: [
      'Chrono24 XML feed\'i genellikle günde 2-4 kez çekilir.',
      'Fiyatlar EUR cinsinden olmalıdır — WatchSync AI otomatik dönüşüm yapar.',
      'Yüksek kaliteli görseller kullanın — Chrono24 minimum 640x480px ister.',
      'Feed önizleme linki ile XML çıktınızı kontrol edebilirsiniz.',
    ],
  },
  Shopify: {
    title: 'Shopify Bağlantı Rehberi',
    steps: [
      {
        title: '1. Shopify Mağazanıza Giriş Yapın',
        desc: 'Shopify Admin paneline giriş yapın. Settings → Apps and sales channels bölümüne gidin.',
        link: 'https://admin.shopify.com',
      },
      {
        title: '2. Custom App Oluşturun',
        desc: 'Develop apps → Create an app ile yeni bir custom app oluşturun. App\'e "WatchSync AI" gibi bir isim verin.',
      },
      {
        title: '3. Admin API Scope\'larını Ayarlayın',
        desc: 'Configuration → Admin API integration bölümünde şu scope\'ları seçin: read_products, write_products, read_inventory, write_inventory.',
      },
      {
        title: '4. API Anahtarlarını Alın',
        desc: 'App\'i "Install" edin. API Credentials sekmesinden Admin API access token, API key ve secret\'i kopyalayın.',
      },
      {
        title: '5. Anahtarları WatchSync AI\'a Girin',
        desc: 'Platform kartındaki "API Anahtarı Gir" butonuna tıklayın. Shopify API key ve secret\'i girin, ardından kaydedin.',
      },
    ],
    tips: [
      'Shopify access token bir kez gösterilir — güvenli bir yerde saklayın.',
      'Mağaza domain\'iniz: yourstore.myshopify.com formatında olmalı.',
      'Envanter senkronizasyonu gerçek zamanlı webhook\'lar ile çalışır.',
      'Shopify Plus olmadan günlük API çağrı limiti: 40 istek/saniye.',
    ],
  },
};

export default function PlatformHelpModal({ platformName, onClose }: PlatformHelpModalProps) {
  const data = HELP_DATA[platformName];

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-primary-text">{data.title}</h2>
          <button onClick={onClose} className="p-1 text-secondary-text hover:text-primary-text rounded-md hover:bg-surface-elevated transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">Adımlar</h3>
            {data.steps.map((step, i) => (
              <div key={i} className="flex gap-3 p-4 bg-surface-elevated border border-border-strong rounded-lg">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-blue/10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-accent-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-text">{step.title}</p>
                  <p className="text-sm text-secondary-text mt-1">{step.desc}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" />
                      {step.link}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">İpuçları</h3>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2">
              {data.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-secondary-text">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle">
          <button onClick={onClose} className="w-full px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
