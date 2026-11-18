/** Module slug (folder / spec file name) -> display name and short description used in reports and docs. */
export interface ModuleInfo {
  slug: string;
  name: string;
  spec: string;
  overview: string;
  scope: string;
}

export const MODULES: ModuleInfo[] = [
  {
    slug: 'auth',
    name: 'Auth',
    spec: 'tests/ui/auth.spec.ts',
    overview: 'Registration, login and logout of a customer, plus the reuse of a saved login session.',
    scope:
      'Each test creates its own user (unique e-mail, random password) through the API and deletes it afterwards, so tests can run in parallel. Client-side (browser) validation is asserted through the HTML5 validity API.',
  },
  {
    slug: 'products',
    name: 'Products',
    spec: 'tests/ui/products.spec.ts',
    overview: 'Product list, product details, search, categories, brands and product reviews.',
    scope:
      'Search matches the product name and its category (for example "top" also finds items of category "Tops"), so assertions use known product names. Data is read-only except for reviews.',
  },
  {
    slug: 'cart',
    name: 'Cart',
    spec: 'tests/ui/cart.spec.ts',
    overview:
      'Adding products to the cart, quantities, removing products, recommended items and the cart after login.',
    scope:
      'Every test uses a fresh anonymous browser session or its own user, because the cart is stored on the server per session.',
  },
  {
    slug: 'checkout',
    name: 'Checkout',
    spec: 'tests/ui/checkout.spec.ts',
    overview: 'Checkout, address review, payment, order confirmation and invoice download.',
    scope:
      'The payment form is a fake: it accepts any well-formed card values (test card 4111 1111 1111 1111). No real money is involved.',
  },
  {
    slug: 'contact',
    name: 'Contact',
    spec: 'tests/ui/contactAndNavigation.spec.ts',
    overview: 'Contact us form (with file upload), header navigation, the Test Cases page and scrolling.',
    scope: 'The contact form shows a browser confirm() dialog before sending; the tests accept it.',
  },
  {
    slug: 'subscription',
    name: 'Subscription',
    spec: 'tests/ui/subscription.spec.ts',
    overview: 'Newsletter subscription from the footer of the home page and of the cart page.',
    scope: 'Only the footer form is tested; no e-mail is actually received.',
  },
  {
    slug: 'defects',
    name: 'Defects',
    spec: 'tests/ui/defects.spec.ts',
    overview:
      'UI defects found on the site. Each test asserts the CORRECT behaviour and is marked test.fail().',
    scope:
      'These tests are expected to fail while the bug exists (see DEFECTS.md). When the site is fixed they turn red as a reminder.',
  },
  {
    slug: 'api',
    name: 'API',
    spec: 'tests/api/api.spec.ts',
    overview:
      'The 14 documented REST-style endpoints (products, brands, search, user account) plus negative cases and API defects.',
    scope:
      'The API answers every call with HTTP 200 and puts the real status in the JSON field responseCode (DEF-04), so functional assertions use responseCode.',
  },
];

export const moduleBySlug = (slug: string): ModuleInfo | undefined => MODULES.find((m) => m.slug === slug);
