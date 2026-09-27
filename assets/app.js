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
}[c]));

const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

const toast = m => {
    let t = $("toast");
    if (!t) return;
    t.textContent = m;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 3200);
};

function modal(id) {
    let el = $(id);
    if (el) el.classList.remove("hidden");
}

function close(id) {
    let el = $(id);
    if (el) el.classList.add("hidden");
}

document.querySelectorAll("[data-modal]").forEach(b => {
    b.onclick = () => {
        modal("modal");
        let loginBox = $("loginBox");
        let signupBox = $("signupBox");
        if (loginBox) loginBox.classList.toggle("hidden", b.dataset.modal !== "login");
        if (signupBox) signupBox.classList.toggle("hidden", b.dataset.modal !== "signup");
    };
});

if ($("closeModal")) $("closeModal").onclick = () => close("modal");
if ($("switchSignup")) $("switchSignup").onclick = () => {
    $("loginBox")?.classList.add("hidden");
    $("signupBox")?.classList.remove("hidden");
};
if ($("switchLogin")) $("switchLogin").onclick = () => {
    $("signupBox")?.classList.add("hidden");
    $("loginBox")?.classList.remove("hidden");
};
if ($("userBtn")) $("userBtn").onclick = () => $("userDrop")?.classList.toggle("hidden");
if ($("logoutBtn")) $("logoutBtn").onclick = () => signOut(auth);
if ($("menuBtn")) $("menuBtn").onclick = () => document.querySelector("nav")?.classList.toggle("mobile-open");

document.querySelectorAll("nav a").forEach(a => {
    a.onclick = () => document.querySelector("nav")?.classList.remove("mobile-open");
});

const demo = [
    {
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
        })).filter(x => x.active !== false);
    } catch (e) {
        jobs = demo;
    }
    if (!jobs.length) jobs = demo;
    if ($("heroJobs")) $("heroJobs").textContent = jobs.length;
    if ($("dashJobs")) $("dashJobs").textContent = jobs.length;
    renderJobs();
}

function renderJobs() {
    let filterEl = $("jobFilter");
    let gridEl = $("jobsGrid");
    if (!filterEl || !gridEl) return;
    let f = filterEl.value;
    let list = jobs.filter(j => f === "all" || j.category === f);
    
    let html = "";
    for (let j of list) {
        html += '<article class="job-card">';
        html += '<div class="job-icon">' + esc(j.icon || "✓") + '</div>';
        html += '<span class="tag">' + esc(j.category || "Other") + '</span>';
        html += '<h3>' + esc(j.title) + '</h3>';
        html += '<p>' + esc(j.description || "See complete job details before applying.") + '</p>';
        html += '<div class="job-meta">';
        html += '<div><small>Application fee</small><b class="fee">' + money(j.fee) + '</b></div>';
        html += '<div><small>Published reward</small><b class="reward">' + money(j.reward) + '</b></div>';
        html += '</div>';
        html += '<div class="job-actions"><button class="btn btn-primary" onclick="window.applyJob(\'' + j.id + '\')">View & Apply</button></div>';
        html += '</article>';
    }
    gridEl.innerHTML = html;
}

if ($("jobFilter")) $("jobFilter").onchange = renderJobs;

window.applyJob = async id => {
    if (!currentUser) {
        toast("Login required to apply.");
        modal("modal");
        $("loginBox")?.classList.remove("hidden");
        $("signupBox")?.classList.add("hidden");
        return;
    }
    let j = jobs.find(x => x.id === id);
    if (!j) return;
    if ($("payTitle")) $("payTitle").textContent = j.title;
    if ($("payDesc")) $("payDesc").textContent = "Application fee for this task is " + money(j.fee) + ". The fee does not guarantee work, approval, income or payout.";
    if ($("payAmount")) $("payAmount").textContent = money(j.fee);
    if ($("merchantUpi")) $("merchantUpi").textContent = UPI_ID;
    if ($("txnId")) $("txnId").value = "";
    $("paymentQr")?.classList.add("hidden");
    $("qrLoading")?.classList.remove("hidden");
    modal("paymentModal");

    const uri = "upi://pay?pa=" + encodeURIComponent(UPI_ID) + "&pn=" + encodeURIComponent("WorkNest") + "&am=" + encodeURIComponent(Number(j.fee).toFixed(2)) + "&cu=INR&tn=" + encodeURIComponent("WorkNest " + j.title);
    let qrImg = $("paymentQr");
    if (qrImg) {
        qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(uri);
        qrImg.onload = () => {
            $("qrLoading")?.classList.add("hidden");
            qrImg.classList.remove("hidden");
        };
    }
    window.pendingJob = j;
};

if ($("closePayment")) $("closePayment").onclick = () => close("paymentModal");
if ($("copyUpi")) $("copyUpi").onclick = async () => {
    try {
        await navigator.clipboard.writeText(UPI_ID);
        toast("UPI ID copied.");
    } catch (e) {
        toast(UPI_ID);
    }
};

if ($("paymentFormModal")) $("paymentFormModal").onsubmit = async e => {
    e.preventDefault();
    if (!currentUser || !window.pendingJob) return;
    let txn = $("txnId")?.value.trim() || "";
    if (txn.length < 6) {
        toast("Enter a valid transaction/reference ID.");
        return;
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
        loadTasks();
    } catch (e) {
        toast(e.message);
    }
};

if ($("signupForm")) $("signupForm").onsubmit = async e => {
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
        toast(e.message);
    }
};

if ($("loginForm")) $("loginForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
        close("modal");
        toast("Login successful.");
    } catch (e) {
        toast(e.message);
    }
};

onAuthStateChanged(auth, async u => {
    currentUser = u;
    $("authButtons")?.classList.toggle("hidden", !!u);
    $("userArea")?.classList.toggle("hidden", !u);
    $("dashboard")?.classList.toggle("hidden", !u);
    document.querySelectorAll(".protected").forEach(x => x.classList.toggle("hidden", !u));
    if (!u) return;

    if ($("userInitial")) $("userInitial").textContent = (u.email || "U")[0].toUpperCase();
    if ($("userShort")) $("userShort").textContent = (u.email || "Account").split("@")[0];
    if ($("pEmail")) $("pEmail").value = u.email;
    if ($("cEmail")) $("cEmail").value = u.email;

    try {
        let s = await getDoc(doc(db, "users", u.uid)),
            d = s.data() || {};
        if (d.role === "admin") {
            let drop = $("userDrop");
            if (drop && !document.getElementById("adminLink")) {
                let a = document.createElement("a");
                a.id = "adminLink";
                a.href = "admin.html";
                a.textContent = "🛠 Admin Panel";
                drop.insertBefore(a, drop.firstChild);
            }
        }
        if ($("pName")) $("pName").value = d.name || "";
        if ($("pMobile")) $("pMobile").value = d.mobile || "";
        if ($("pCity")) $("pCity").value = d.city || "";
        if ($("welcomeName")) $("welcomeName").textContent = d.name || u.email.split("@")[0];
        if ($("cName")) $("cName").value = d.name || "";
        if ($("upi")) $("upi").value = d.upi || "";
        if ($("holder")) $("holder").value = d.holder || "";
        if ($("bankAccount")) $("bankAccount").value = d.bankAccount || "";
        if ($("ifsc")) $("ifsc").value = d.ifsc || "";
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
        
        let tasksBox = $("tasksBox");
        if (tasksBox) {
            if (rows.length > 0) {
                let tableHtml = '<div class="table-wrap"><table class="table"><tr><th>Job</th><th>Fee</th><th>Payment</th><th>Status</th></tr>';
                for (let r of rows) {
                    tableHtml += '<tr><td>' + esc(r.jobTitle) + '</td><td>' + money(r.fee) + '</td><td>' + esc(r.paymentStatus || "—") + '</td><td class="status ' + esc(r.status || "pending") + '">' + esc(r.status || "pending") + '</td></tr>';
                }
                tableHtml += '</table></div>';
                tasksBox.innerHTML = tableHtml;
            } else {
                tasksBox.innerHTML = '<div class="panel">You have no applications yet. Browse Available Jobs to get started.</div>';
            }
        }

        if ($("dashActive")) $("dashActive").textContent = rows.filter(x => x.status === "pending").length;
        if ($("dashPending")) $("dashPending").textContent = rows.filter(x => x.paymentStatus === "submitted_for_verification").length;
        
        let approvedEarnings = rows.filter(x => x.status === "approved").reduce((a, x) => a + Number(x.reward || 0), 0);
        let pendingEarnings = rows.filter(x => x.status === "pending").reduce((a, x) => a + Number(x.reward || 0), 0);
        
        if ($("dashEarnings")) $("dashEarnings").textContent = money(approvedEarnings);
        if ($("walletBalance")) $("walletBalance").textContent = money(approvedEarnings);
        if ($("walletPending")) $("walletPending").textContent = money(pendingEarnings);
        if ($("walletPaid")) $("walletPaid").textContent = "₹0";
    } catch (e) {
        let tasksBox = $("tasksBox");
        if (tasksBox) tasksBox.innerHTML = '<div class="panel">Could not load your tasks. Check Firebase configuration/rules.</div>';
    }
}

if ($("profileForm")) $("profileForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            name: $("pName")?.value.trim() || "",
            mobile: $("pMobile")?.value.trim() || "",
            city: $("pCity")?.value.trim() || ""
        }, { merge: true });
        if ($("welcomeName")) $("welcomeName").textContent = $("pName")?.value.trim() || "";
        toast("Profile saved.");
    } catch (e) {
        toast(e.message);
    }
};

if ($("paymentForm")) $("paymentForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            upi: $("upi")?.value.trim() || "",
            holder: $("holder")?.value.trim() || "",
            bankAccount: $("bankAccount")?.value.trim() || "",
            ifsc: $("ifsc")?.value.trim() || ""
        }, { merge: true });
        toast("Payout details saved.");
    } catch (e) {
        toast(e.message);
    }
};

if ($("passwordForm")) $("passwordForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await updatePassword(currentUser, $("newPassword").value);
        if ($("newPassword")) $("newPassword").value = "";
        toast("Password updated.");
    } catch (e) {
        toast(e.message);
    }
};

if ($("payoutBtn")) $("payoutBtn").onclick = async () => {
    if (!currentUser) {
        toast("Please login first.");
        return;
    }
    try {
        let s = await getDocs(query(collection(db, "applications"), where("userId", "==", currentUser.uid)));
        let rows = s.docs.map(d => d.data());
        let approvedEarnings = rows.filter(x => x.status === "approved").reduce((a, x) => a + Number(x.reward || 0), 0);
        
        if (approvedEarnings < 500) {
            toast("Minimum payout amount is ₹500.");
            return;
        }

        await addDoc(collection(db, "payoutRequests"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            amount: approvedEarnings,
            status: "pending",
            createdAt: serverTimestamp()
        });

        toast("Payout request submitted successfully!");
        if ($("dashPending")) $("dashPending").textContent = "Requested";
    } catch (e) {
        toast(e.message);
    }
};

if ($("contactForm")) $("contactForm").onsubmit = async e => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "supportTickets"), {
            userId: currentUser?.uid || null,
            name: $("cName")?.value || "",
            email: $("cEmail")?.value || "",
            message: $("cMessage")?.value || "",
            status: "open",
            createdAt: serverTimestamp()
        });
        e.target.reset();
        toast("Support request sent.");
    } catch (e) {
        toast(e.message);
    }
};

loadJobs();
