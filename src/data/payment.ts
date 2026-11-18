export interface PaymentCard {
  nameOnCard: string;
  number: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

/** The site does not process payments; any well-formed values are accepted. */
export const testCard = (nameOnCard = 'QA Tester'): PaymentCard => ({
  nameOnCard,
  number: '4111111111111111',
  cvc: '123',
  expiryMonth: '12',
  expiryYear: '2030',
});
