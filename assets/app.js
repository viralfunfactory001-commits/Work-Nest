import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgDvLzPn3I31-tOzfBTv8qFI2WpgdDG9M",
  authDomain: "online-jobs-a6370.firebaseapp.com",
  databaseURL: "https://online-jobs-a6370-default-rtdb.firebaseio.com",
  projectId: "online-jobs-a6370",
  storageBucket: "online-jobs-a6370.firebasestorage.app",
  messagingSenderId: "248277964605",
  appId: "1:248277964605:web:a47f9fe272ef5b6f419754",
  measurementId: "G-XRJZD4J0CV"
};
const app = initializeApp(firebaseConfig),
    auth = getAuth(app),
    db = getFirestore(app);
const UPI_ID = "vishalkhan@fam";
const $ = id => document.getElementById(id);
let currentUser = null,
    jobs = [];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
} [c]));
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const toast = m => {
    let t = $("toast");
    t.textContent = m;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 3200)
};

function modal(id) {
    $(id).classList.remove("hidden")
}

function close(id) {
    $(id).classList.add("hidden")
}

document.querySelectorAll("[data-modal]").forEach(b => b.onclick = () => {
    modal("modal");
    $("loginBox").classList.toggle("hidden", b.dataset.modal !== "login");
    $("signupBox").classList.toggle("hidden", b.dataset.modal !== "signup")
});
$("closeModal").onclick = () => close("modal");
$("switchSignup").onclick = () => {
    $("loginBox").classList.add("hidden");
    $("signupBox").classList.remove("hidden")
};
$("switchLogin").onclick = () => {
    $("signupBox").classList.add("hidden");
    $("loginBox").classList.remove("hidden")
};
$("userBtn").onclick = () => $("userDrop").classList.toggle("hidden");
$("logoutBtn").onclick = () => signOut(auth);
$("menuBtn").onclick = () => document.querySelector("nav").classList.toggle("mobile-open");
document.querySelectorAll("nav a").forEach(a => a.onclick = () => document.querySelector("nav").classList.remove("mobile-open"));

const demo = [{
        id: "demo-data",
        title: "Data Entry Project",
        category: "Data Entry",
        description: "Enter structured information into a provided template.",
        fee: 199,
        reward: 700,
        icon: "▦"
    },
    {
        id: "demo-typing",
        title: "Typing & Formatting Task",
        category: "Typing",
        description: "Type and format supplied documents according to the project instructions.",
        fee: 150,
        reward: 500,
        icon: "⌨"
    },
    {
        id: "demo-writing",
        title: "Short Written Work",
        category: "Writing",
        description: "Complete an original short writing assignment using the supplied brief.",
        fee: 100,
        reward: 350,
        icon: "✎"
    }
];
async function loadJobs() {
    try {
        let s = await getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc")));
        jobs = s.docs.map(d => ({
            id: d.id,
            ...d.data()
        })).filter(x => x.active !== false)
    } catch (e) {
        jobs = demo
    }
    if (!jobs.length) jobs = demo;
    $("heroJobs").textContent = jobs.length;
    $("dashJobs").textContent = jobs.length;
    renderJobs();
}

function renderJobs() {
    let f = $("jobFilter").value;
    let list = jobs.filter(j => f === "all" || j.category === f);
    $("jobsGrid").innerHTML = list.map(j => `<article class="job-card"><div class="job-icon">${esc(j.icon||"✓")}</div><span class="tag">${esc(j.category||"Other")}</span><h3>${esc(j.title)}</h3><p>${esc(j.description||"See complete job details before applying.")}</p><div class="job-meta"><div><small>Application fee</small><b class="fee">${money(j.fee)}</b></div><div><small>Published reward</small><b class="reward">${money(j.reward)}</b></div></div><div class="job-actions"><button class="btn btn-primary" onclick="applyJob('${j.id}')">View & Apply</button></div></article>`).join("");
}
$("jobFilter").onchange = renderJobs;

window.applyJob = async id => {
    if (!currentUser) {
        toast("Login required to apply.");
        modal("modal");
        $("loginBox").classList.remove("hidden");
        $("signupBox").classList.add("hidden");
        return
    }
    let j = jobs.find(x => x.id === id);
    if (!j) return;
    $("payTitle").textContent = j.title;
    $("payDesc").textContent = `Application fee for this task is ${money(j.fee)}. The fee does not guarantee work, approval, income or payout.`;
    $("payAmount").textContent = money(j.fee);
    $("merchantUpi").textContent = UPI_ID;
    $("txnId").value = "";
    $("paymentQr").classList.add("hidden");
    $("qrLoading").classList.remove("hidden");
    modal("paymentModal");
    // UPI deep link with exact amount. QR image is generated by a public QR image endpoint; replace with your own QR generator/backend in production if desired.
    const uri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("WorkNest")}&am=${encodeURIComponent(Number(j.fee).toFixed(2))}&cu=INR&tn=${encodeURIComponent("WorkNest "+j.title)}`;
    $("paymentQr").src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(uri);
    $("paymentQr").onload = () => {
        $("qrLoading").classList.add("hidden");
        $("paymentQr").classList.remove("hidden")
    };
    window.pendingJob = j;
};
$("closePayment").onclick = () => close("paymentModal");
$("copyUpi").onclick = async () => {
    try {
        await navigator.clipboard.writeText(UPI_ID);
        toast("UPI ID copied.")
    } catch (e) {
        toast(UPI_ID)
    }
};

$("paymentFormModal").onsubmit = async e => {
    e.preventDefault();
    if (!currentUser || !window.pendingJob) return;
    let txn = $("txnId").value.trim();
    if (txn.length < 6) {
        toast("Enter a valid transaction/reference ID.");
        return
    }
    try {
        await addDoc(collection(db, "applications"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            jobId: window.pendingJob.id,
            jobTitle: window.pendingJob.title,
            category: window.pendingJob.category,
            fee: Number(window.pendingJob.fee),
            reward: Number(window.pendingJob.reward || 0),
            paymentMethod: "UPI",
            merchantUpi: UPI_ID,
            transactionId: txn,
            paymentStatus: "submitted_for_verification",
            status: "pending",
            createdAt: serverTimestamp()
        });
        close("paymentModal");
        toast("Payment reference submitted for verification.");
    } catch (e) {
        toast(e.message)
    }
};

$("signupForm").onsubmit = async e => {
    e.preventDefault();
    try {
        let c = await createUserWithEmailAndPassword(auth, $("sEmail").value.trim(), $("sPassword").value);
        await setDoc(doc(db, "users", c.user.uid), {
            name: $("sName").value.trim(),
            mobile: $("sMobile").value.trim(),
            city: $("sCity").value.trim(),
            email: c.user.email,
            role: "user",
            createdAt: serverTimestamp()
        });
        close("modal");
        toast("Account created.");
    } catch (e) {
        toast(e.message)
    }
};
$("loginForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
        close("modal");
        toast("Login successful.");
    } catch (e) {
        toast(e.message)
    }
};

onAuthStateChanged(auth, async u => {
    currentUser = u;
    $("authButtons").classList.toggle("hidden", !!u);
    $("userArea").classList.toggle("hidden", !u);
    $("dashboard").classList.toggle("hidden", !u);
    document.querySelectorAll(".protected").forEach(x => x.classList.toggle("hidden", !u));
    if (!u) return;
    $("userInitial").textContent = (u.email || "U")[0].toUpperCase();
    $("userShort").textContent = (u.email || "Account").split("@")[0];
    $("pEmail").value = u.email;
    $("cEmail").value = u.email;
    try {
        let s = await getDoc(doc(db, "users", u.uid)),
            d = s.data() || {};
        if (d.role === "admin") {
            let drop = $("userDrop");
            if (!document.getElementById("adminLink")) {
                let a = document.createElement("a");
                a.id = "adminLink";
                a.href = "admin.html";
                a.textContent = "🛠 Admin Panel";
                drop.insertBefore(a, drop.firstChild)
            }
        }
        $("pName").value = d.name || "";
        $("pMobile").value = d.mobile || "";
        $("pCity").value = d.city || "";
        $("welcomeName").textContent = d.name || u.email.split("@")[0];
        $("cName").value = d.name || "";
        $("upi").value = d.upi || "";
        $("holder").value = d.holder || "";
        $("bankAccount").value = d.bankAccount || "";
        $("ifsc").value = d.ifsc || ""
    } catch (e) {}
    await loadTasks();
});

async function loadTasks() {
    if (!currentUser) return;
    try {
        let s = await getDocs(query(collection(db, "applications"), where("userId", "==", currentUser.uid)));
        let rows = s.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        $("tasksBox").innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><tr><th>Job</th><th>Fee</th><th>Payment</th><th>Status</th></tr>${rows.map(r=>`<tr><td>${esc(r.jobTitle)}</td><td>${money(r.fee)}</td><td>${esc(r.paymentStatus||"—")}</td><td class="status ${esc(r.status||"pending")}">${esc(r.status||"pending")}</td></tr>`).join("")}</table></div>` : `<div class="panel">You have no applications yet. Browse Available Jobs to get started.</div>`;
        $("dashActive").textContent = rows.filter(x => x.status === "pending").length;
        $("dashPending").textContent = rows.filter(x => x.paymentStatus === "submitted_for_verification").length;
        $("dashEarnings").textContent = money(rows.filter(x => x.status === "approved").reduce((a, x) => a + Number(x.reward || 0), 0));
        $("walletBalance").textContent = $("dashEarnings").textContent;
    } catch (e) {
        $("tasksBox").innerHTML = '<div class="panel">Could not load your tasks. Check Firebase configuration/rules.</div>'
    }
}
$("profileForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            name: $("pName").value.trim(),
            mobile: $("pMobile").value.trim(),
            city: $("pCity").value.trim()
        }, {
            merge: true
        });
        $("welcomeName").textContent = $("pName").value.trim();
        toast("Profile saved.")
    } catch (e) {
        toast(e.message)
    }
};
$("paymentForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            upi: $("upi").value.trim(),
            holder: $("holder").value.trim(),
            bankAccount: $("bankAccount").value.trim(),
            ifsc: $("ifsc").value.trim()
        }, {
            merge: true
        });
        toast("Payout details saved.")
    } catch (e) {
        toast(e.message)
    }
};
$("passwordForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await updatePassword(currentUser, $("newPassword").value);
        $("newPassword").value = "";
        toast("Password updated.")
    } catch (e) {
        toast(e.message)
    }
};
$("payoutBtn").onclick = () => toast("Payout request can be submitted after the ₹500 minimum and payout details are verified.");
$("contactForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "supportTickets"), {
            userId: currentUser?.uid || null,
            name: $("cName").value,
            email: $("cEmail").value,
            message: $("cMessage").value,
            status: "open",
            createdAt: serverTimestamp()
        });
        e.target.reset();
        toast("Support request sent.")
    } catch (e) {
        toast(e.message)
    }
};
loadJobs();