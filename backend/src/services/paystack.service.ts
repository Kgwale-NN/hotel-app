import { createHmac, timingSafeEqual } from "crypto";

type InitializeCheckoutInput = {
  email: string;
  amountMinorUnits: number;
  currency: string;
  reference: string;
  bookingId: string;
};

type PaystackResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export async function initializePaystackCheckout(
  input: InitializeCheckoutInput
): Promise<NonNullable<PaystackResponse["data"]>> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  if (!Number.isInteger(input.amountMinorUnits) || input.amountMinorUnits <= 0) {
    throw new Error("Payment amount must be a positive whole number of minor units.");
  }

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountMinorUnits),
        currency: input.currency,
        reference: input.reference,
        metadata: { booking_id: input.bookingId },
      }),
    }
  );

  const result = (await response.json()) as PaystackResponse;

  if (!response.ok || !result.status || !result.data?.authorization_url) {
    throw new Error(result.message || "Paystack could not start checkout.");
  }

  return result.data;
}

export function isValidPaystackSignature(
  rawBody: Buffer,
  signature: string | undefined
): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || !signature || !/^[a-f0-9]{128}$/i.test(signature)) {
    return false;
  }

  const expected = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest();

  const received = Buffer.from(signature, "hex");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}