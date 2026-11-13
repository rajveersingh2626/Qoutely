import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qoutely.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Qoutely — Commercial Insurance Broker Operating System (All 7 Lines)',
    template: '%s | Qoutely',
  },
  description:
    'The premier enterprise AI underwriting and deterministic tariff calculation operating system for Indian IRDAI licensed commercial insurance brokers. Instant BLUS/BSUS loss-cost pricing, Motor Fleet (AIMT GR.8), Marine Cargo (Sec 64VB), Employee Benefits (EC Act 1923), Engineering (CAR/EAR), Liability, and GFR 170/171 Surety Bonds.',
  keywords: [
    'commercial insurance broker India',
    'IRDAI commercial insurance broker software',
    'BLUS BSUS fire tariff calculator',
    'IIB burning cost loss-cost parity',
    'AIMT GR.8 IDV depreciation schedule',
    'marine cargo open policy insurance Section 64VB',
    'corporate group health GMC GPA census',
    'Employees Compensation Act 1923 Schedule IV',
    'engineering insurance CAR EAR MB Indian Boilers Act',
    'commercial general liability CGL D&O',
    'DPDP Act 2023 cyber insurance scoring',
    'surety insurance bonds GFR 170 171 India',
    'insurance broker operating system',
  ],
  authors: [{ name: 'Qoutely Technologies Private Limited' }],
  creator: 'Qoutely',
  publisher: 'Qoutely Technologies',
  category: 'finance',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'Qoutely — Commercial Insurance Operating System for Brokers',
    description:
      'Deterministic tariff calculations and AI underwriting for Indian commercial brokers across all 7 Lines of Business. Close commercial deals 3× faster with zero manual typing.',
    url: baseUrl,
    siteName: 'Qoutely',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/qoutely_logo.png`,
        width: 512,
        height: 512,
        alt: 'Qoutely — Commercial Insurance Broker Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qoutely — AI Commercial Insurance OS for Indian Brokers',
    description:
      'Pure deterministic underwriting & statutory tariff calculations for IRDAI commercial brokers. Property, Fleet, Marine, Benefits, Engineering, Liability, and Surety.',
    images: [`${baseUrl}/qoutely_logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Comprehensive Schema.org JSON-LD Structured Data for Indian Commercial Broker OS
const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['FinancialService', 'InsuranceAgency'],
      '@id': `${baseUrl}/#organization`,
      name: 'Qoutely',
      legalName: 'Qoutely Technologies Private Limited',
      alternateName: 'Qoutely AI Commercial Insurance Operating System',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/qoutely_logo.png`,
        width: 512,
        height: 512,
      },
      description:
        'Enterprise multi-tenant operating system and deterministic underwriting engine for Indian IRDAI-licensed commercial insurance brokers across all 7 Lines of Business.',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      currenciesAccepted: 'INR',
      paymentAccepted: 'Bank Transfer, UPI, Corporate Invoicing, Credit Card',
      priceRange: '₹4,999 - ₹14,999 per month',
      knowsAbout: [
        'IRDAI (Insurance Brokers) Regulations 2018 & 2024',
        'Bharat Laghu Udyam Suraksha (BLUS) & Bharat Sookshma Udyam Suraksha (BSUS)',
        'All India Motor Tariff (AIMT) GR.8 IDV Depreciation & IRDAI TP Tariffs',
        'Marine Cargo ITC A/B/C, Ocean ICC A/B/C & Section 64VB Cash Deposit Drawdown',
        'Employees Compensation Act 1923 Schedule IV & IALM 2012-14 Group Term Life',
        'Indian Boilers Act 1923, CAR/EAR & Machinery Breakdown Insurance',
        'Commercial General Liability (CGL), D&O, and DPDP Act 2023 Cyber Scoring',
        'General Financial Rules (GFR) 2017 Rule 170/171 Surety Insurance Bonds',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/#software`,
      name: 'Qoutely Broker OS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Cloud Browser SaaS',
      offers: [
        {
          '@type': 'Offer',
          name: 'Independent Broker Plan',
          price: '4999',
          priceCurrency: 'INR',
          unitText: 'MONTH',
          description: 'Essential underwriting automation for boutique commercial practices.',
        },
        {
          '@type': 'Offer',
          name: 'Growth Commercial Brokerage Plan',
          price: '14999',
          priceCurrency: 'INR',
          unitText: 'MONTH',
          description: 'Complete omni-line AI underwriting OS across all 7 Lines with IRDAI statutory compliance.',
        },
      ],
    },
    {
      '@type': 'OfferCatalog',
      '@id': `${baseUrl}/#catalog`,
      name: 'Indian Commercial Insurance Underwriting Lines',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Property & Fire Insurance (BLUS / BSUS / SFSP)',
            description: 'Statutory BLUS/BSUS loss-cost calculation with IIB burning cost cross-check, STFI rates, and BIS IS 1893:2002 seismic zone ratings.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Commercial Motor Fleet Insurance',
            description: 'Statutory AIMT GR.8 IDV age depreciation, IRDAI gazetted TP tariffs, commercial IMT endorsements (IMT 23/28), and fleet volume discounts.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Marine Cargo & Transit Insurance',
            description: 'Inland ITC A/B/C, Ocean ICC A/B/C, Incoterms CIF 110% valuation, and Section 64VB Insurance Act 1938 Cash Deposit balance enforcement.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Employee Benefits Insurance (GMC / GTLI / GPA / WC)',
            description: 'Corporate Group Health demographic age-banding, IALM 2012-14 GTLI mortality, and Employees Compensation Act 1923 Schedule IV statutory wages.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Engineering & Project Insurance (CAR / EAR / MB / EEI / BPP)',
            description: 'CAR/EAR civil vs plant split, testing duration loadings, Machinery Breakdown Groups I–IV, and Indian Boilers Act 1923 boiler perils.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corporate Liability & Cyber Insurance (CGL / PI / D&O / Cyber / Crime)',
            description: 'Turnover rating with AOA:AOY ratios, IRDAI broker PI minimum check, D&O Side A/B/C, and DPDP Act 2023 100-point cyber posture scoring.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Financial & Specialty Lines (Surety Bonds / Trade Credit / Burglary)',
            description: 'GFR 2017 Rule 170/171 Surety Insurance Bonds (Bid, Performance, Advance), IRDAI Trade Credit insurance, and First Loss Burglary rating.',
          },
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${baseUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does Qoutely ensure compliance with IRDAI regulations?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Qoutely embeds deterministic Indian insurance statutory rules directly into its TypeScript calculation engine. All fire tariffs adhere to BLUS/BSUS regulations, motor IDVs strictly follow AIMT GR.8 depreciation schedules, marine policies comply with Section 64VB of the Insurance Act 1938, and workmen compensation calculations adhere to Section 4 and Schedule IV of the Employees Compensation Act 1923. Zero calculations are outsourced to generative AI or LLMs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Qoutely benchmark loss ratios against the Insurance Information Bureau of India (IIB)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Qoutely cross-references baseline property burning costs against gazetted IIB loss costs across commercial occupancies (textiles, chemicals, plastics, heavy engineering) and flags high-risk loss run deviations for commercial motor and group health portfolios.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can Qoutely generate quotes for government tenders using Surety Insurance Bonds under GFR 170/171?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Qoutely supports Surety Insurance Bonds replacing Bank Guarantees in accordance with Ministry of Finance General Financial Rules (GFR) 2017 Rules 170 and 171, rating Bid Bonds, Performance Bonds, Advance Payment Bonds, and Retention Money Bonds across contractor credit grades AAA to BB.',
          },
        },
        {
          '@type': 'Question',
          name: 'Where is customer and policy data stored under Indian sovereign compliance?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'All policyholder census, risk details, and quote schedules are stored within Indian sovereign data borders using AES-256 cloud encryption, tenant-isolated schemas, and full compliance with the Digital Personal Data Protection (DPDP) Act, 2023 and CERT-In directions.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="antialiased font-sans selection:bg-[#0F5132] selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#0F5132] focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F5132]"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <WorkspaceProvider>
            <AppShell>{children}</AppShell>
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
