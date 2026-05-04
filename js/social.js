import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2uKP4A1tJfjrJ72XAcHSpAswUlVMfk1k",
  authDomain: "web-bracetty.firebaseapp.com",
  projectId: "web-bracetty",
  storageBucket: "web-bracetty.firebasestorage.app",
  messagingSenderId: "209290084673",
  appId: "1:209290084673:web:3d93ef5c411f407beaa1c0",
  measurementId: "G-WTH0NYEY9G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   USERNAME
========================= */

function loadSavedUsername() {
  const savedName = localStorage.getItem("bracettyUsername");
  if (!savedName) return;

  ["A", "B"].forEach(preview => {
    const input = document.getElementById(`name${preview}`);
    if (input) input.value = savedName;
  });
}

function saveUsername(username) {
  localStorage.setItem("bracettyUsername", username);
}

/* =========================
   VOTOS
========================= */

window.vote = async function(preview) {
  const alreadyVoted = localStorage.getItem(`votedPreview${preview}`);

  if (alreadyVoted) {
    alert(`Ya votaste por ${preview}.`);
    return;
  }

  const voteRef = doc(db, "votes", preview);
  const snap = await getDoc(voteRef);

  if (!snap.exists()) {
    await setDoc(voteRef, { count: 1 });
  } else {
    await updateDoc(voteRef, {
      count: increment(1)
    });
  }

  localStorage.setItem(`votedPreview${preview}`, "true");
};

function loadVotes() {
  ["A", "B"].forEach(preview => {
    const voteRef = doc(db, "votes", preview);

    onSnapshot(voteRef, snap => {
      const count = snap.exists() ? snap.data().count : 0;
      const voteText = document.getElementById(`votes${preview}`);

      if (voteText) voteText.textContent = `${count} votos`;
    });
  });
}

/* =========================
   COMENTARIOS
========================= */

window.addComment = async function(preview) {
  const usernameInput = document.getElementById(`name${preview}`);
  const commentInput = document.getElementById(`comment${preview}`);

  if (!usernameInput || !commentInput) return;

  const username = usernameInput.value.trim();
  const text = commentInput.value.trim();

  if (!username || !text) {
    alert("Escribe tu usuario y comentario.");
    return;
  }

  saveUsername(username);

  await addDoc(collection(db, "comments"), {
    preview,
    username,
    text,
    likes: 0,
    parentId: null,
    createdAt: serverTimestamp()
  });

  commentInput.value = "";
};

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatMentions(text) {
  return text.replace(/@(\w+)/g, `<span class="mention">@$1</span>`);
}

function loadComments(preview) {
  const q = query(
    collection(db, "comments"),
    where("preview", "==", preview)
  );

  onSnapshot(q, snapshot => {
    const container = document.getElementById(`comments${preview}`);
    if (!container) return;

    const comments = [];

    snapshot.forEach(docSnap => {
      comments.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    comments.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    const mainComments = comments.filter(comment => !comment.parentId);
    const replies = comments.filter(comment => comment.parentId);

    container.innerHTML = mainComments
      .map(comment => {
        const commentReplies = replies.filter(reply => reply.parentId === comment.id);
        return renderComment(comment, preview, commentReplies);
      })
      .join("");
  }, error => {
    console.error("Error cargando comentarios:", error);
  });
}

function renderComment(comment, preview, replies = []) {
  const safeUser = escapeHTML(comment.username || "usuario");
  const safeText = formatMentions(escapeHTML(comment.text || ""));
  const firstLetter = safeUser.charAt(0).toUpperCase();

  const repliesHTML = replies.map(reply => {
    const replyUser = escapeHTML(reply.username || "usuario");
    const replyText = formatMentions(escapeHTML(reply.text || ""));

    return `
      <div class="reply-post">
        <strong>@${replyUser}</strong>
        <p>${replyText}</p>

        <div class="comment-actions">
          <button onclick="likeComment('${reply.id}')">♡</button>
          <span>${reply.likes || 0} likes</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="comment-post">
      <div class="comment-header">
        <div class="avatar">${firstLetter}</div>
        <strong>@${safeUser}</strong>
      </div>

      <p>${safeText}</p>

      <div class="comment-actions">
        <button onclick="likeComment('${comment.id}')">♡ Like</button>
        <span>${comment.likes || 0} likes</span>
        <button onclick="showReplyBox('${comment.id}')">Responder</button>
      </div>

      <div class="reply-box" id="replyBox-${comment.id}" style="display:none;">
        <input id="replyInput-${comment.id}" placeholder="Responder a @${safeUser}...">
        <button onclick="addReply('${comment.id}', '${preview}')">Enviar</button>
      </div>

      <div class="replies-list">
        ${repliesHTML}
      </div>
    </div>
  `;
}

/* =========================
   LIKES
========================= */

window.likeComment = async function(commentId) {
  const alreadyLiked = localStorage.getItem(`liked-${commentId}`);

  if (alreadyLiked) {
    alert("Ya le diste like a este comentario.");
    return;
  }

  const commentRef = doc(db, "comments", commentId);

  await updateDoc(commentRef, {
    likes: increment(1)
  });

  localStorage.setItem(`liked-${commentId}`, "true");
};

/* =========================
   RESPUESTAS
========================= */

window.showReplyBox = function(commentId) {
  const box = document.getElementById(`replyBox-${commentId}`);
  if (!box) return;

  box.style.display = box.style.display === "none" ? "flex" : "none";
};

window.addReply = async function(parentId, preview) {
  const savedName = localStorage.getItem("bracettyUsername");
  const usernameInput = document.getElementById(`name${preview}`);
  const replyInput = document.getElementById(`replyInput-${parentId}`);

  if (!replyInput) return;

  const username = savedName || usernameInput?.value.trim();
  const text = replyInput.value.trim();

  if (!username || !text) {
    alert("Escribe tu usuario y respuesta.");
    return;
  }

  saveUsername(username);

  await addDoc(collection(db, "comments"), {
    preview,
    username,
    text,
    likes: 0,
    parentId,
    createdAt: serverTimestamp()
  });

  replyInput.value = "";
};

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadSavedUsername();
    loadVotes();
    loadComments("A");
    loadComments("B");
  }, 300);
});