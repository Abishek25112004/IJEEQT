// src/pages/Dashboard.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { papersAPI, paymentsAPI, contentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BM25 } from "../utils/bm25";
import { PageHero, PaperCard, Spinner, EmptyState, StatusBadge, Card } from "../components/common";

// ─── Search Bar ───────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative mb-4">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
    {value && (
      <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
    )}
  </div>
);

const Dashboard = () => {
  const { profile } = useAuth();
  const [papers, setPapers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("papers");
  const [paperSearch, setPaperSearch] = useState("");
  const [apcAmount, setApcAmount] = useState(5000);

  useEffect(() => {
    Promise.all([
      papersAPI.getAll({ onlyOwn: "true" }).then((res) => setPapers(res.papers || [])),
      paymentsAPI.getMyPayments().then((res) => setPayments(res.payments || [])).catch(() => {}),
    ]).finally(() => setLoading(false));

    // Fetch dynamic APC amount from CFP content
    contentAPI.getContent("call_for_papers").then((res) => {
      if (res.value?.indianAmount) setApcAmount(res.value.indianAmount);
    }).catch(() => {});
  }, []);

  const statusCounts = papers.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // Client-side search for papers using BM25
  const filteredPapers = useMemo(() => {
    if (!paperSearch.trim()) return papers;
    
    const bm25 = new BM25(papers, (p) => [
      p.title,
      p.status,
      ...(p.keywords || []),
      p.abstract
    ]);
    return bm25.search(paperSearch);
  }, [papers, paperSearch]);

  const handlePayment = async (paper) => {
    try {
      const order = await paymentsAPI.createOrder({ paperId: paper.id, amount: apcAmount });
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: process.env.REACT_APP_JOURNAL_ABBR || "IJEEQT",
          description: `APC for: ${paper.title}`,
          order_id: order.orderId,
          prefill: { name: order.userName, email: order.userEmail },
          theme: { color: "#1d4ed8" },
          handler: async (response) => {
            await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paperId: paper.id,
            });
            alert("Payment successful! Your paper is now in queue for publication.");
            window.location.reload();
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      alert("Payment error: " + err.message);
    }
  };

  // Role-based links
  const isAdmin = (profile?.roles || []).includes("admin") || profile?.role === "admin";
  const isEditor = (profile?.roles || []).includes("editor") || profile?.role === "editor";
  const isManager = (profile?.roles || []).includes("manager") || profile?.role === "manager";
  const isReviewer = (profile?.roles || []).includes("reviewer") || profile?.role === "reviewer";

  return (
    <div>
      <PageHero
        title={`Welcome, ${profile?.name || "Author"}`}
        subtitle="Track your submissions and manage your research."
        breadcrumb="Home / Dashboard"
      />
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Submissions", value: papers.length, color: "blue" },
            { label: "Under Review", value: statusCounts.under_review || 0, color: "yellow" },
            { label: "Accepted", value: (statusCounts.accepted || 0) + (statusCounts.published || 0), color: "green" },
            { label: "Published", value: statusCounts.published || 0, color: "emerald" },
          ].map((s) => (
            <Card key={s.label} className={`p-4 text-center border-t-4 border-${s.color}-500`}>
              <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/submit-paper" className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium">
            + Submit New Paper
          </Link>
          {isAdmin && (
            <Link to="/admin" className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-900 transition font-medium">
              🛡️ Admin Panel
            </Link>
          )}
          {isEditor && (
            <Link to="/editor" className="bg-purple-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-800 transition font-medium">
              📝 Editor Panel
            </Link>
          )}
          {(isAdmin || isManager) && (
            <Link to="/site-content" className="bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-800 transition font-medium">
              ⚙️ Manage Site Content
            </Link>
          )}
          {isReviewer && (
            <Link to="/reviewer" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              🔍 Reviewer Panel
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {["papers", "payments"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab} ({tab === "papers" ? papers.length : payments.length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner center />
        ) : activeTab === "papers" ? (
          <>
            <SearchBar
              value={paperSearch}
              onChange={setPaperSearch}
              placeholder="Search by title, status, or keyword…"
            />
            {paperSearch && (
              <p className="text-xs text-gray-400 mb-3">{filteredPapers.length} of {papers.length} papers</p>
            )}
            {filteredPapers.length > 0 ? (
              <div className="space-y-4">
                {filteredPapers.map((p) => (
                  <div key={p.id} className="relative">
                    <PaperCard paper={p} showStatus searchTerm={paperSearch} />
                    {p.status === "accepted" && p.paymentStatus !== "paid" && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-yellow-800">⚠️ Paper accepted! Pay APC (₹{apcAmount.toLocaleString()}) to proceed to publication.</p>
                        <button onClick={() => handlePayment(p)} className="bg-yellow-500 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-yellow-600">Pay Now</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={paperSearch ? "No matching papers" : "No submissions yet"}
                message={paperSearch ? `No papers match "${paperSearch}"` : "Start by submitting your first manuscript."}
                action={!paperSearch && (
                  <Link to="/submit-paper" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">Submit Paper</Link>
                )}
              />
            )}
          </>
        ) : (
          payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((pay) => (
                <Card key={pay.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Order: {pay.razorpayOrderId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(pay.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">₹{pay.amount?.toLocaleString()}</p>
                      <StatusBadge status={pay.status} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No payments" message="Payment history will appear here." />
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
