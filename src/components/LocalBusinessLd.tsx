import { site } from '../site.config';

const data = {
  '@context': 'https://schema.org',
  '@type': 'HardwareStore',
  name: site.fullName,
  description:
    'Paint, primer, putty and hardware shop in Teliyarganj, Prayagraj. Asian Paints, Berger, Nerolac, Birla Opus and Birla White, with shade mixing at the counter.',
  telephone: site.phoneDisplay,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop 4, Jhalwa Road, Teliyarganj',
    addressLocality: 'Prayagraj',
    addressRegion: 'Uttar Pradesh',
    postalCode: '211004',
    addressCountry: 'IN',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:30',
      closes: '14:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '16:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday'],
      opens: '10:00',
      closes: '14:00',
    },
  ],
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, UPI, Card, Credit (contractors)',
  brand: site.brands.map((name) => ({ '@type': 'Brand', name })),
};

export function LocalBusinessLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
