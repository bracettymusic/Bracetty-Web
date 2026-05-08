import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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

let initialLoadDone = false;

const ARTIST_NAME = "bracetty";
const ARTIST_CODE = "gris1231";

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
function isArtistMode() {
  return localStorage.getItem("artistMode") === "true";
}

window.exitArtistMode = function() {
  localStorage.removeItem("artistMode");
  alert("Artist mode desactivado.");
  location.reload();
};

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
  const voteCounts = {
    A: 0,
    B: 0
  };

  ["A", "B"].forEach(preview => {

    const voteRef = doc(db, "votes", preview);

    onSnapshot(voteRef, snap => {

      voteCounts[preview] =
        snap.exists() ? snap.data().count : 0;

      const totalVotes =
        voteCounts.A + voteCounts.B;

        const trending =
  document.getElementById("trendingPreview");

if (trending) {

  if (voteCounts.A > voteCounts.B) {
    trending.textContent =
      "🔥 Preview A is trending";
  }

  else if (voteCounts.B > voteCounts.A) {
    trending.textContent =
      "🔥 Preview B is trending";
  }

  else {
    trending.textContent =
      "🔥 Ambos previews están empatados";
  }

}

      ["A", "B"].forEach(item => {

        const count = voteCounts[item];

        const percent =
          totalVotes > 0
            ? Math.round((count / totalVotes) * 100)
            : 0;

        const voteText =
          document.getElementById(`votes${item}`);

        const voteBar =
          document.getElementById(`bar${item}`);

        if (voteText) {
          voteText.textContent =
            `${count} votos · ${percent}%`;
        }

        if (voteBar) {
  voteBar.style.width = `${percent}%`;

  const otherItem = item === "A" ? "B" : "A";

  if (voteCounts[item] > voteCounts[otherItem]) {
    voteBar.style.boxShadow = `
      0 0 18px var(--main-glow),
      0 0 40px var(--second-glow)
    `;
  } else {
    voteBar.style.boxShadow = `0 0 10px var(--main-glow)`;
  }
}

      });

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

  if (username.toLowerCase() === ARTIST_NAME) {
  const code = prompt("Clave de artista:");

  if (code !== ARTIST_CODE) {
    alert("No puedes usar ese nombre.");
    return;
  }

  localStorage.setItem("artistMode", "true");

}

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
  playPopSound();
};

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatMentions(text) {
  return text.replace(/@(\w+)/g, `<span class="mention">@$1</span>`);
}

function showLiveNotification(message) {
  const notification = document.getElementById("liveNotification");

  if (!notification) return;

  notification.textContent = message;

  notification.classList.remove("hidden");

  requestAnimationFrame(() => {
    notification.classList.add("show");
  });

  setTimeout(() => {
    notification.classList.remove("show");

    setTimeout(() => {
      notification.classList.add("hidden");
    }, 350);

  }, 2600);
}

function loadComments(preview) {
  const q = query(
    collection(db, "comments"),
    where("preview", "==", preview)
  );

  onSnapshot(q, snapshot => {
    if (initialLoadDone && snapshot.docChanges().some(change => change.type === "added")) {
  showLiveNotification("Nuevo comentario 💬");
}
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

    const mainComments = comments
  .filter(comment => !comment.parentId)
  .sort((a, b) => {

  const pinA = a.pinned ? 1 : 0;
  const pinB = b.pinned ? 1 : 0;

  if (pinB !== pinA)
    return pinB - pinA;

  const likesA = a.likes || 0;
  const likesB = b.likes || 0;

  if (likesB !== likesA)
    return likesB - likesA;

  const timeA = a.createdAt?.seconds || 0;
  const timeB = b.createdAt?.seconds || 0;

  return timeB - timeA;

});

const replies = comments.filter(comment => comment.parentId);

const topCommentId = mainComments.length > 0 ? mainComments[0].id : null;

container.innerHTML = mainComments
  .map(comment => {
    const commentReplies = replies.filter(reply => reply.parentId === comment.id);
    return renderComment(comment, preview, commentReplies, comment.id === topCommentId && (comment.likes || 0) > 0);
  })
  .join("");
  container.scrollTop = 0;

  }, error => {
    console.error("Error cargando comentarios:", error);
  });
}

function getTimeAgo(timestamp) {
  if (!timestamp?.seconds) return "ahora";

  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);

  if (seconds < 60) return "ahora";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;

  return `hace ${Math.floor(seconds / 86400)} d`;
}

function getAvatarColor(username) {
  let hash = 0;

  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 85%, 55%), hsl(${(hue + 45) % 360}, 85%, 55%))`;
}

function renderComment(comment, preview, replies = [], isTopComment = false) {
  const safeUser = escapeHTML(comment.username || "usuario");
  const isArtist =
  safeUser.toLowerCase() === ARTIST_NAME;
  const canArtistEdit = isArtistMode();
  const safeText = formatMentions(escapeHTML(comment.text || ""));
  const firstLetter = safeUser.charAt(0).toUpperCase();
  const timeAgo = getTimeAgo(comment.createdAt);
  const avatarColor = getAvatarColor(safeUser);

  const repliesHTML = replies.map(reply => {
    const replyUser = escapeHTML(reply.username || "usuario");
    const replyText = formatMentions(escapeHTML(reply.text || ""));
    const replyLetter = replyUser.charAt(0).toUpperCase();
    const replyTimeAgo = getTimeAgo(reply.createdAt);
    const replyAvatarColor = getAvatarColor(replyUser);

    return `
      <div class="reply-post">
        <div class="comment-header">
          <div class="avatar" style="background:${replyAvatarColor};">${replyLetter}</div>
          <div>
            <strong>
  @${replyUser}
${replyUser.toLowerCase() === ARTIST_NAME ? `<span class="artist-badge">✓ ARTIST</span>` : ""}
</strong>
            <span class="comment-time">${replyTimeAgo}</span>
          </div>
        </div>

        <p>${replyText}</p>

      <div class="comment-actions reactions-row">
  <button onclick="reactToComment('${reply.id}', 'heart')">❤️ ${reply.reactions?.heart || 0}</button>
  <button onclick="reactToComment('${reply.id}', 'fire')">🔥 ${reply.reactions?.fire || 0}</button>
  <button onclick="reactToComment('${reply.id}', 'laugh')">😂 ${reply.reactions?.laugh || 0}</button>
  <button onclick="reactToComment('${reply.id}', 'wow')">😮 ${reply.reactions?.wow || 0}</button>
</div>
</div>
    `;
  }).join("");

  return `
<div class="
  comment-post
  ${isTopComment ? "top-comment" : ""}
  ${isArtist ? "artist-comment" : ""}
">
      ${isTopComment ? `<div class="top-badge">🔥 Top comment</div>` : ""}
      ${isArtist
  ? `<div class="artist-replied">✔ Bracetty replied</div>`
  : ""
}

      <div class="comment-header">
        <div class="avatar" style="background:${avatarColor};">${firstLetter}</div>

        <div>
          <strong>
  @${safeUser}

${isArtist ? `<span class="artist-badge">✓ ARTIST</span>` : ""}
</strong>
          <span class="comment-time">${timeAgo}</span>
        </div>
      </div>

      <p>${safeText}</p>

      <div class="comment-actions reactions-row">
  <button onclick="reactToComment('${comment.id}', 'heart')">❤️ ${comment.reactions?.heart || 0}</button>
  <button onclick="reactToComment('${comment.id}', 'fire')">🔥 ${comment.reactions?.fire || 0}</button>
  <button onclick="reactToComment('${comment.id}', 'laugh')">😂 ${comment.reactions?.laugh || 0}</button>
  <button onclick="reactToComment('${comment.id}', 'wow')">😮 ${comment.reactions?.wow || 0}</button>
  <button onclick="showReplyBox('${comment.id}')">Responder</button>
  ${canArtistEdit ? `
<button onclick="pinComment('${comment.id}')">
  ${comment.pinned ? "📍 Unpin" : "📌 Pin"}
</button>
    <button onclick="deleteComment('${comment.id}')">🗑️ Delete</button>
  ` : ""}
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

function playPopSound() {
  const sound = document.getElementById("popSound");

  if (!sound) return;

  sound.currentTime = 0;

  sound.play().catch(() => {
    console.log("Audio bloqueado por el navegador.");
  });
}

function spawnReaction(emoji) {
  const container = document.getElementById("floating-reactions");

  if (!container) {
    console.log("No existe #floating-reactions");
    return;
  }

  const reaction = document.createElement("div");
  reaction.className = "floating-reaction";
  reaction.textContent = emoji;

  reaction.style.left = `${Math.random() * 40 + 30}%`;
  reaction.style.top = `${Math.random() * 25 + 45}%`;

  container.appendChild(reaction);

  setTimeout(() => {
    reaction.remove();
  }, 1600);
}


/* =========================
   LIKES
========================= */

window.reactToComment = async function(commentId, reactionType) {
  const reactionKey = `reacted-${commentId}-${reactionType}`;

  if (localStorage.getItem(reactionKey)) {
    alert("Ya reaccionaste con ese emoji.");
    return;
  }

  const commentRef = doc(db, "comments", commentId);

  await updateDoc(commentRef, {
    [`reactions.${reactionType}`]: increment(1),
    likes: increment(1)
  });

  localStorage.setItem(reactionKey, "true");
  playPopSound();
  const emojis = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  wow: "😮"
};

spawnReaction(emojis[reactionType]);

};

window.pinComment = async function(commentId) {
  const code = prompt("Artist code:");

  if (code !== ARTIST_CODE) {
    alert("Código incorrecto.");
    return;
  }

  const commentRef = doc(db, "comments", commentId);
  const snap = await getDoc(commentRef);

  if (!snap.exists()) return;

  const isPinned = snap.data().pinned === true;

  await updateDoc(commentRef, {
    pinned: !isPinned
  });
};

window.deleteComment = async function(commentId) {
  const code = prompt("Artist code:");

  if (code !== ARTIST_CODE) {
    alert("Código incorrecto.");
    return;
  }

  const confirmDelete = confirm("¿Seguro que quieres borrar este comentario?");

  if (!confirmDelete) return;

  await deleteDoc(doc(db, "comments", commentId));
};

window.likeComment = async function(commentId) {
  await reactToComment(commentId, "heart");
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


  if (username.toLowerCase() === ARTIST_NAME) {
  const code = prompt("Clave de artista:");

  if (code !== ARTIST_CODE) {
    alert("No puedes usar ese nombre.");
    return;
  }
  localStorage.setItem("artistMode", "true");
}


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
  playPopSound();
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

    ["A", "B"].forEach(preview => {
  const input = document.getElementById(`comment${preview}`);

  if (!input) return;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      addComment(preview);
    }
  });
});

  }, 300);

  setTimeout(() => {
    initialLoadDone = true;

  }, 2000);
});