"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const GOAL = 18000;

function fmt(n: number) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0, 2) || "?";
}

type Donor = {
  name: string;
  amount: number;
  dedication: string | null;
  isMonthly: boolean;
  createdAt: string;
};

export default function DonatePage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dedication, setDedication] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDonors() {
    try {
      const res = await fetch("/api/donors");
      const data = await res.json();
      setTotalRaised(data.totalRaised || 0);
      setDonors(data.donors || []);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadDonors();
    const interval = setInterval(loadDonors, 60000);
    return () => clearInterval(interval);
  }, []);

  const raised = Math.min(totalRaised, GOAL);
  const pct = Math.min((raised / GOAL) * 100, 100);
  const starPct = Math.max(Math.min(pct, 98), 0);

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(v);
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + " / " + v.slice(2);
    setCardExpiry(v);
  }

  function handleCVVChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardCVV(e.target.value.replace(/\D/g, "").slice(0, 4));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !phone || !amount || !cardNumber || !cardExpiry || !cardCVV ||
        !billingAddress || !billingCity || !billingZip) {
      setError("Please fill in all required fields.");
      return;
    }
    if (parseFloat(amount) < 1) {
      setError("Donation amount must be at least $1.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, dedication, amount,
          isMonthly: frequency === "monthly",
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardExpiry: cardExpiry.replace(/\s/g, ""),
          cardCVV,
          billingAddress, billingCity, billingZip,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        const freq = frequency === "monthly" ? "monthly" : "one-time";
        setSuccess(`🎉 Thank you, ${name}! Your ${freq} donation of ${fmt(parseFloat(amount))} has been received. Transaction ID: ${data.transactionId}`);
        setName(""); setEmail(""); setPhone(""); setDedication(""); setAmount("");
        setFrequency("once"); setBillingAddress(""); setBillingCity(""); setBillingZip("");
        setCardNumber(""); setCardExpiry(""); setCardCVV("");
        await loadDonors();
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const QUICK_AMOUNTS = [180, 360, 1000, 1800];
  const input = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-10">

      {/* Back link */}
      <div className="max-w-5xl mx-auto mb-6">
        <Link href="/" className="text-sm text-blue-700 hover:underline">← Back to home</Link>
      </div>

      {/* Goal tracker card */}
      <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-1 text-center">Support Mishnayos Sukkah</h1>
        <p className="text-gray-500 text-center text-sm mb-5">Help us build our next masechta of animated Mishnayos series</p>

        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Goal</div>
            <div className="text-xl font-bold text-blue-900">{fmt(GOAL)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Raised</div>
            <div className="text-xl font-bold text-blue-700">{fmt(raised)}</div>
          </div>
        </div>

        <div className="relative h-4 bg-blue-100 rounded-full overflow-visible mb-2">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          <span className="absolute top-1/2 -translate-y-1/2 text-sm transition-all duration-700" style={{ left: `${starPct}%` }}>⭐</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span><strong className="text-gray-700">{donors.length}</strong> donors</span>
          <span className="font-semibold text-blue-600">{pct < 0.1 && pct > 0 ? "< 0.1%" : pct.toFixed(1) + "%"} funded</span>
          <span><strong className="text-gray-700">{fmt(raised)}</strong> raised</span>
        </div>
      </div>

      {/* Two-column: form + donor wall */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donation form */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1 text-center">Make a Donation</h2>
          <p className="text-gray-500 text-center mb-6 text-sm">All transactions are secure and encrypted</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Yosef Goldstein" required className={input} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" required className={input} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="180" min="1" step="1" required
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                    amount === String(a) ? "bg-blue-700 text-white border-blue-700" : "text-blue-700 border-blue-300 hover:bg-blue-50"
                  }`}>
                  {fmt(a)}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button type="button" onClick={() => setFrequency("once")}
                className={`flex-1 py-2 text-sm font-medium transition ${frequency === "once" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                One-Time
              </button>
              <button type="button" onClick={() => setFrequency("monthly")}
                className={`flex-1 py-2 text-sm font-medium transition ${frequency === "monthly" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                Monthly
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">In Honor / Memory Of <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={dedication} onChange={e => setDedication(e.target.value)}
                placeholder="e.g. In memory of Moshe ben Avraham" className={input} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address <span className="text-red-500">*</span></label>
              <input type="text" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="123 Main St" required className={input} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input type="text" value={billingCity} onChange={e => setBillingCity(e.target.value)} placeholder="Los Angeles" required className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP <span className="text-red-500">*</span></label>
                <input type="text" value={billingZip} onChange={e => setBillingZip(e.target.value)} placeholder="90210" maxLength={10} required className={input} />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="text-sm font-medium text-gray-700">💳 Payment Information</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number <span className="text-red-500">*</span></label>
                <input type="text" value={cardNumber} onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456" maxLength={19} required autoComplete="cc-number"
                  className={input + " font-mono"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry <span className="text-red-500">*</span></label>
                  <input type="text" value={cardExpiry} onChange={handleExpiryChange}
                    placeholder="MM / YY" maxLength={7} required autoComplete="cc-exp"
                    className={input + " font-mono"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV <span className="text-red-500">*</span></label>
                  <input type="text" value={cardCVV} onChange={handleCVVChange}
                    placeholder="123" maxLength={4} required autoComplete="cc-csc"
                    className={input + " font-mono"} />
                </div>
              </div>
              <p className="text-xs text-gray-400">🔒 Secured and encrypted via Authorize.net</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">{success}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                frequency === "monthly" ? "Donate Monthly" : "Donate Now"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        {/* Donor wall */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1 text-center">Donor Wall</h2>
          <p className="text-gray-500 text-center mb-6 text-sm">Thank you to everyone who has contributed</p>

          {donors.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <div className="text-4xl mb-3">🌟</div>
              <p>Be the first to donate!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {donors.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm truncate">{d.name}</span>
                      {d.isMonthly && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Monthly</span>
                      )}
                    </div>
                    {d.dedication && (
                      <div className="text-xs text-gray-500 truncate">✨ {d.dedication}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className="font-bold text-blue-700 text-sm flex-shrink-0">{fmt(d.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} Mishnayos Brachos · Chabad of S. La Cienega
      </p>
    </div>
  );
}
