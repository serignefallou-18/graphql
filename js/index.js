
var endpointLogin = "https://learn.zone01dakar.sn/api/auth/signin";
// URL du point de terminaison pour l'authentification

const credentials = {
  username: "",
  password: "",
};
console.log(credentials);
// Objet pour stocker les informations d'identification de l'utilisateur

function encodeBase64(str) {
  return btoa(str);
}
// Fonction pour encoder une chaîne en base64 en utilisant la méthode btoa

const login = () => {
  // Encodez les informations d'identification en base64
  const base64Credentials = encodeBase64(
    `${credentials.username}:${credentials.password}`
  );
  console.log(base64Credentials);

  // Construisez l'en-tête Authorization pour Basic authentication
  const headers = {
    Authorization: `Basic ${base64Credentials}`,
    "Content-Type": "application/json",
  };

  // Effectuez une requête POST à l'endpoint /api/auth/signin
  fetch(endpointLogin, {
    method: "POST",
    headers: headers,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid credentials");
        // Lance une erreur si les identifiants sont invalides
      }
      return response.json();
      // Convertit la réponse en JSON
    })
    .then((data) => {
      if (typeof data == "string") {
        localStorage.setItem("token", data);
        console.log(data);
        // Stocke le jeton dans localStorage
        setTimeout(() => {
            window.location.href = "Myprofil.html";
        }, 500); // 500ms correspond à la durée de votre animation fade-out
      } else {
        displayError("Your credentials are incorrect");
        // Affiche un message d'erreur si les identifiants sont incorrects
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la requête :", error);
      displayError("An error occurred while trying to log in");
      // Affiche un message d'erreur en cas d'échec de la requête
    });
};

function displayError(message) {
  let error = document.getElementById("error");
  error.textContent = message;
  error.style.color = "red";
}
// Fonction pour afficher un message d'erreur

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      let username = document.getElementById("username").value;
      let password = document.getElementById("password").value;
      credentials.username = username;
      credentials.password = password;
      document.getElementById("loaderContainer").style.display = "flex";
      document.getElementById("overlay").style.display = "block"; // Afficher l'overlay

      // Simuler un délai pour cacher le loader après 3 secondes (à remplacer par une action réelle comme une requête API)
      setTimeout(function () {
        document.getElementById("loaderContainer").style.display = "none";
        document.getElementById("overlay").style.display = "none"; // Cacher l'overlay
        // credentials.username = username;
        // credentials.password = password;
        login();
      }, 3000);
      // Empêche le rechargement de la page lors du clic sur le bouton
      // Appelle la fonction login avec les informations d'identification de l'utilisateur
    });
  }

  const showPasswordCheckbox = document.getElementById("showPassword");
  if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener("change", (e) => {
      const passwordInput = document.getElementById("password");
      if (e.target.checked) {
        passwordInput.type = "text";
      } else {
        passwordInput.type = "password";
      }
    });
  }

  // Ajoute un gestionnaire d'événements pour détecter la touche "Entrée"
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Empêche le rechargement de la page lors de l'appui sur "Entrée"
      let username = document.getElementById("username").value;
      let password = document.getElementById("password").value;
      credentials.username = username;
      credentials.password = password;
      document.getElementById("loaderContainer").style.display = "flex";
      document.getElementById("overlay").style.display = "block"; // Afficher l'overlay

      // Simuler un délai pour cacher le loader après 3 secondes (à remplacer par une action réelle comme une requête API)
      setTimeout(function () {
        document.getElementById("loaderContainer").style.display = "none";
        document.getElementById("overlay").style.display = "none"; // Cacher l'overlay
        // credentials.username = username;
        // credentials.password = password;
        login();
      }, 3000);    }
  });
});

function preventBack() {
  window.history.pushState(null, "", window.location.href);
  window.onpopstate = function () {
    window.history.pushState(null, "", window.location.href);
  };
}



preventBack();
