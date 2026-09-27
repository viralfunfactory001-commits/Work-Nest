import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
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
const $ = id => document.getElementById(id),
    money = n => "₹" + Number(n || 0).toLocaleString("en-IN"),
    esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    } [c]));
const toast = m => {
    let t = $("toast");
    if (!t) return;
    t.textContent = m;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 3000)
};
let users = [],
    jobs = [],
    apps = [],
    subs = [],
    payouts = [],
    tickets = [];

function showTab(id) {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    $(id).classList.add("active");
    document.querySelectorAll(".sidebar nav button").forEach(x => x.classList.toggle("active", x.dataset.tab === id));
    $("pageTitle").textContent = document.querySelector(`[data-tab="${id}"]`)?.textContent.replace(/^[^ ]+ /, "") || "Dashboard";
}
document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => showTab(b.dataset.tab));
document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => showTab(b.dataset.go));
$("backUser").onclick = () => location.href = "index.html";
$("logout").onclick = () => signOut(auth);

onAuthStateChanged(auth, async u => {
    if (!u) {
        location.href = "index.html";
        return
    }
    try {
        let us = await getDoc(doc(db, "users", u.uid));
        if (!us.exists() || us.data().role !== "admin") {
            toast("Admin access denied.");
            setTimeout(() => location.href = "index.html", 1200);
            return
        }
        $("adminEmail").textContent = u.email;
        await loadAll();
    } catch (e) {
        toast("Firebase error: " + e.message)
    }
});

async function getCol(name) {
    try {
        return (await getDocs(collection(db, name))).docs.map(d => ({
            id: d.id,
            ...d.data()
        }))
    } catch (e) {
        return []
    }
}
async function loadAll() {
    [users, jobs, apps, payouts, tickets] = await Promise.all(["users", "jobs", "applications", "payoutRequests", "supportTickets"].map(getCol));
    // Applications data ko hi submissions ke liye use kar rahe hain kyunki saara task data wahin store ho raha hai
    subs = apps;

    $("sUsers").textContent = users.length;
    $("sJobs").textContent = jobs.filter(x => x.active !== false).length;
    $("sApps").textContent = apps.length;
    $("sVerify").textContent = apps.filter(x => x.paymentStatus === "submitted_for_verification").length;
    renderUsers();
    renderJobs();
    renderApps();
    renderSubs();
    renderPayouts();
    renderTickets();
}

function table(html) {
    return `<div class="table-wrap"><table class="table">${html}</table></div>`
}

function renderUsers() {
    $("usersTable").innerHTML = table(`<tr><th>User</th><th>Mobile</th><th>City</th><th>Role</th><th>Created</th></tr>` + users.map(u => `<tr><td><b>${esc(u.name||"—")}</b><small>${esc(u.email)}</small></td><td>${esc(u.mobile)}</td><td>${esc(u.city)}</td><td>${esc(u.role||"user")}</td><td>${date(u.createdAt)}</td></tr>`).join(""));
}

function renderJobs() {
    $("jobsTable").innerHTML = table(`<tr><th>Job</th><th>Category</th><th>Fee</th><th>Reward</th><th>Status</th><th>Action</th></tr>` + jobs.map(j => `<tr><td><b>${esc(j.title)}</b><small>${esc(j.description)}</small></td><td>${esc(j.category)}</td><td>${money(j.fee)}</td><td>${money(j.reward)}</td><td>${j.active!==false?"Active":"Paused"}</td><td><button class="btn light" onclick="editJob('${j.id}')">Edit</button><button class="btn danger" onclick="removeJob('${j.id}')">Delete</button></td></tr>`).join(""));
}

function renderApps() {
    $("appsTable").innerHTML = table(`<tr><th>Applicant</th><th>Job</th><th>Fee</th><th>Transaction ID</th><th>Payment</th><th>Application</th><th>Action</th></tr>` + apps.map(a => `<tr><td>${esc(a.userEmail)}</td><td>${esc(a.jobTitle)}</td><td>${money(a.fee)}</td><td>${esc(a.transactionId)}</td><td class="status ${esc(a.paymentStatus)}">${esc(a.paymentStatus||"—")}</td><td>${esc(a.status||"pending")}</td><td>${a.paymentStatus==="submitted_for_verification"?`<button class="btn success" onclick="verifyApp('${a.id}',true)">Verify</button><button class="btn danger" onclick="verifyApp('${a.id}',false)">Reject</button>`:"—"}</td></tr>`).join(""));
}

function renderSubs() {
    $("submissionsTable").innerHTML = table(`<tr><th>User</th><th>Task</th><th>Reward</th><th>Status</th><th>Action</th></tr>` + subs.map(s => `<tr><td>${esc(s.userEmail||s.userId)}</td><td>${esc(s.jobTitle)}</td><td>${money(s.reward)}</td><td>${esc(s.status||"pending")}</td><td>${s.status==="pending" || !s.status?`<button class="btn success" onclick="reviewSub('${s.id}',true)">Approve</button><button class="btn danger" onclick="reviewSub('${s.id}',false)">Reject</button>`:"—"}</td></tr>`).join(""));
}

function renderPayouts() {
    $("payoutsTable").innerHTML = table(`<tr><th>User</th><th>Amount</th><th>Method</th><th>Details</th><th>Status</th><th>Action</th></tr>` + payouts.map(p => `<tr><td>${esc(p.userEmail)}</td><td>${money(p.amount)}</td><td>${esc(p.method||"UPI")}</td><td>${esc(p.upi||p.account||"—")}</td><td>${esc(p.status||"pending")}</td><td>${p.status==="pending"?`<button class="btn success" onclick="markPayout('${p.id}','paid')">Mark Paid</button><button class="btn danger" onclick="markPayout('${p.id}','rejected')">Reject</button>`:"—"}</td></tr>`).join(""));
}

function renderTickets() {
    $("ticketsTable").innerHTML = table(`<tr><th>User</th><th>Email</th><th>Message</th><th>Status</th><th>Action</th></tr>` + tickets.map(t => `<tr><td>${esc(t.name)}</td><td>${esc(t.email)}</td><td>${esc(t.message)}</td><td>${esc(t.status||"open")}</td><td>${t.status!=="closed"?`<button class="btn light" onclick="closeTicket('${t.id}')">Close</button>`:"Closed"}</td></tr>`).join(""));
}

function date(x) {
    if (!x) return "—";
    try {
        return x.toDate ? x.toDate().toLocaleString("en-IN") : new Date(x).toLocaleString("en-IN")
    } catch (e) {
        return "—"
    }
}

$("newJob").onclick = () => openJob();
$("closeJob").onclick = () => $("jobModal").classList.add("hidden");

function openJob(j = null) {
    $("jobModal").classList.remove("hidden");
    $("jobModalTitle").textContent = j ? "Edit Job" : "Add Job";
    $("jobId").value = j?.id || "";
    $("jTitle").value = j?.title || "";
    $("jCategory").value = j?.category || "Data Entry";
    $("jDesc").value = j?.description || "";
    $("jFee").value = j?.fee ?? 199;
    $("jReward").value = j?.reward ?? 500;
    $("jSlots").value = j?.slots ?? 100;
    $("jActive").checked = j?.active !== false
}
window.editJob = id => openJob(jobs.find(x => x.id === id));
window.removeJob = async id => {
    if (!confirm("Delete this job?")) return;
    try {
        await deleteDoc(doc(db, "jobs", id));
        toast("Job deleted.");
        loadAll()
    } catch (e) {
        toast(e.message)
    }
};
$("jobForm").onsubmit = async e => {
    e.preventDefault();
    let id = $("jobId").value,
        data = {
            title: $("jTitle").value.trim(),
            category: $("jCategory").value,
            description: $("jDesc").value.trim(),
            fee: Number($("jFee").value),
            reward: Number($("jReward").value),
            slots: Number($("jSlots").value),
            active: $("jActive").checked,
            updatedAt: serverTimestamp()
        };
    try {
        if (id) await updateDoc(doc(db, "jobs", id), data);
        else await addDoc(collection(db, "jobs"), {
            ...data,
            createdAt: serverTimestamp()
        });
        $("jobModal").classList.add("hidden");
        toast("Job saved.");
        loadAll()
    } catch (e) {
        toast(e.message)
    }
};

window.verifyApp = async (id, ok) => {
    try {
        await updateDoc(doc(db, "applications", id), {
            paymentStatus: ok ? "verified" : "rejected",
            status: ok ? "active" : "rejected",
            verifiedAt: serverTimestamp()
        });
        toast(ok ? "Payment verified." : "Payment rejected.");
        loadAll()
    } catch (e) {
        toast(e.message)
    }
};

window.reviewSub = async (id, ok) => {
    try {
        let subDoc = apps.find(s => s.id === id);
        if (!subDoc) return;

        await updateDoc(doc(db, "applications", id), {
            status: ok ? "approved" : "rejected",
            reviewedAt: serverTimestamp()
        });

        toast(ok ? "Task approved and wallet updated." : "Task rejected.");
        loadAll();
    } catch (e) {
        toast(e.message);
    }
};

window.markPayout = async (id, status) => {
    try {
        let payoutDoc = payouts.find(p => p.id === id);
        if (!payoutDoc) return;

        await updateDoc(doc(db, "payoutRequests", id), {
            status,
            processedAt: serverTimestamp()
        });

        if (status === "paid" && payoutDoc.userId) {
            let q = query(collection(db, "applications"), where("userId", "==", payoutDoc.userId), where("status", "==", "approved"));
            let querySnapshot = await getDocs(q);
            let updatePromises = querySnapshot.docs.map(appDoc => 
                updateDoc(doc(db, "applications", appDoc.id), { status: "paid" })
            );
            await Promise.all(updatePromises);
        }

        toast("Payout updated and wallet adjusted.");
        loadAll();
    } catch (e) {
        toast(e.message);
    }
};

window.closeTicket = async id => {
    try {
        await updateDoc(doc(db, "supportTickets", id), {
            status: "closed",
            closedAt: serverTimestamp()
        });
        loadAll()
    } catch (e) {
        toast(e.message)
    }
};

$("userSearch").oninput = () => {
    let q = $("userSearch").value.toLowerCase();
    document.querySelectorAll("#usersTable tbody tr").forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none")
};
