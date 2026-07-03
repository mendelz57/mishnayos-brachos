import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { Resend } from "resend";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SDKConstants = require("authorizenet").Constants;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ApiControllers = require("authorizenet").APIControllers;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ApiContracts = require("authorizenet").APIContracts;

const NOTIFY_EMAIL = "rabbimendel@chabadsola.com";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const {
    name, email, phone, dedication, amount, isMonthly,
    cardNumber, cardExpiry, cardCVV,
    billingAddress, billingCity, billingZip,
  } = body as Record<string, string | boolean>;

  if (!name || !email || !phone || !amount || !cardNumber || !cardExpiry || !cardCVV ||
      !billingAddress || !billingCity || !billingZip) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const donationAmount = parseFloat(amount as string);
  if (isNaN(donationAmount) || donationAmount < 1) {
    return NextResponse.json({ error: "Donation amount must be at least $1." }, { status: 400 });
  }

  const [expMonth, expYear] = (cardExpiry as string).split("/").map((s) => s.trim());

  const merchantAuth = new ApiContracts.MerchantAuthenticationType();
  merchantAuth.setName(process.env.AUTHORIZENET_API_LOGIN_ID);
  merchantAuth.setTransactionKey(process.env.AUTHORIZENET_TRANSACTION_KEY);

  const creditCard = new ApiContracts.CreditCardType();
  creditCard.setCardNumber((cardNumber as string).replace(/\s/g, ""));
  creditCard.setExpirationDate(`${expMonth}${expYear.length === 2 ? "20" + expYear : expYear}`);
  creditCard.setCardCode(cardCVV);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  const orderDetails = new ApiContracts.OrderType();
  orderDetails.setInvoiceNumber(`BRACHOS-${Date.now()}`);
  orderDetails.setDescription("Mishnayos Brachos Animated Videos Donation");

  const nameStr = name as string;
  const billTo = new ApiContracts.CustomerAddressType();
  billTo.setFirstName(nameStr.split(" ")[0]);
  billTo.setLastName(nameStr.split(" ").slice(1).join(" ") || ".");
  billTo.setEmail(email);
  billTo.setAddress(billingAddress);
  billTo.setCity(billingCity);
  billTo.setZip(billingZip);

  const transactionRequest = new ApiContracts.TransactionRequestType();
  transactionRequest.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequest.setPayment(paymentType);
  transactionRequest.setOrder(orderDetails);
  transactionRequest.setBillTo(billTo);
  transactionRequest.setAmount(donationAmount.toFixed(2));

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequest);

  const env =
    process.env.AUTHORIZENET_ENV === "production"
      ? SDKConstants.endpoint.production
      : SDKConstants.endpoint.sandbox;

  const transactionResult = await new Promise<ReturnType<typeof ApiContracts.CreateTransactionResponse>>((resolve) => {
    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(env);
    ctrl.execute(() => {
      const apiResponse = ctrl.getResponse();
      const response = new ApiContracts.CreateTransactionResponse(apiResponse);
      resolve(response);
    });
  });

  const messages = transactionResult.getMessages();
  if (!messages || messages.getResultCode() !== ApiContracts.MessageTypeEnum.OK) {
    const errMsg =
      transactionResult.getTransactionResponse()?.getErrors()?.getError()?.[0]?.getErrorText() ||
      "Payment declined.";
    return NextResponse.json({ error: errMsg }, { status: 402 });
  }

  const txResponse = transactionResult.getTransactionResponse();
  if (!txResponse || txResponse.getResponseCode() !== "1") {
    const errMsg = txResponse?.getErrors()?.getError()?.[0]?.getErrorText() || "Payment declined.";
    return NextResponse.json({ error: errMsg }, { status: 402 });
  }

  const transactionId = txResponse.getTransId();

  await db.insert(donations).values({
    name: nameStr,
    email: email as string,
    phone: phone as string,
    dedication: (dedication as string) || null,
    amount: donationAmount,
    isMonthly: !!isMonthly,
    transactionId,
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const freq = isMonthly ? "Monthly Recurring" : "One-Time";
    const firstName = nameStr.split(" ")[0];
    const dedLine = dedication
      ? `<tr><td style="padding:8px 0;color:#6b8899;font-weight:600;border-bottom:1px solid #f0f4f6;">In Honor / Memory Of</td><td style="padding:8px 0;border-bottom:1px solid #f0f4f6;">${dedication}</td></tr>`
      : "";
    const dedThankYou = dedication
      ? `<p style="margin:0 0 16px;color:#1e3a5f;">Your gift in honor of <strong>${dedication}</strong> will be remembered and cherished.</p>`
      : "";
    const monthlyNote = isMonthly
      ? `<p style="font-size:13px;color:#6b7280;margin-top:16px;">Your card will be charged <strong>$${donationAmount.toFixed(2)}</strong> each month. To make changes, contact us directly.</p>`
      : "";

    await Promise.all([
      resend.emails.send({
        from: "Mishnayos Brachos <noreply@chabadsola.com>",
        to: NOTIFY_EMAIL,
        subject: `New Donation: $${donationAmount.toFixed(2)} from ${nameStr}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">New Donation Received</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#6b8899;border-bottom:1px solid #f0f4f6;">Donor</td><td style="border-bottom:1px solid #f0f4f6;font-weight:700;">${nameStr}</td></tr>
            <tr><td style="padding:8px 0;color:#6b8899;border-bottom:1px solid #f0f4f6;">Amount</td><td style="border-bottom:1px solid #f0f4f6;font-weight:800;color:#1d4ed8;font-size:20px;">$${donationAmount.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b8899;border-bottom:1px solid #f0f4f6;">Frequency</td><td style="border-bottom:1px solid #f0f4f6;">${freq}</td></tr>
            <tr><td style="padding:8px 0;color:#6b8899;border-bottom:1px solid #f0f4f6;">Email</td><td style="border-bottom:1px solid #f0f4f6;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#6b8899;border-bottom:1px solid #f0f4f6;">Phone</td><td style="border-bottom:1px solid #f0f4f6;">${phone}</td></tr>
            ${dedLine}
            <tr><td style="padding:8px 0;color:#6b8899;">Transaction ID</td><td style="font-size:12px;color:#aaa;">${transactionId}</td></tr>
          </table>
        </div>`,
      }),
      resend.emails.send({
        from: "Rabbi Mendel <noreply@chabadsola.com>",
        to: email as string,
        subject: `Thank you for your donation, ${firstName}!`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#1e3a5f;">Thank You, ${firstName}!</h2>
          <p style="color:#374151;">Dear ${firstName},</p>
          <p style="color:#374151;">Your generous donation of <strong style="color:#1d4ed8;font-size:18px;">$${donationAmount.toFixed(2)}</strong> has been received. We are deeply grateful for your support.</p>
          ${dedThankYou}
          <p style="color:#374151;">Your contribution helps bring the beauty of Mishnayos Brachos to life through animated videos, making Torah learning engaging and accessible for children everywhere.</p>
          <p style="color:#374151;">May you be blessed with good health, happiness, and much nachas!<br/><br/><strong>Rabbi Mendel Zajac</strong><br/>Chabad of S. La Cienega</p>
          ${monthlyNote}
          <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;">Receipt: Transaction #${transactionId} · ${freq} donation of $${donationAmount.toFixed(2)}</p>
        </div>`,
      }),
    ]);
  } catch (err) {
    console.error("Email notification failed:", err);
  }

  return NextResponse.json({ success: true, transactionId });
}
