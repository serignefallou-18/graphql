var endpointLogin = "https://learn.zone01dakar.sn/api/auth/signin";

const credentials = {
    username: "",
    password: ""
};

function encodeBase64(str) {
    return btoa(str);
}

const login = () => {
    // Encodez les informations d'identification en base64
    const base64Credentials = encodeBase64(`${credentials.username}:${credentials.password}`);
    console.log(base64Credentials);
    
    // Construisez l'en-tête Authorization pour Basic authentication
    const headers = {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json'
    };

    // Effectuez une requête POST à l'endpoint /api/auth/signin
    fetch(endpointLogin, {
            method: 'POST',
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            return response.json();
        })
        .then(data => {
            if (typeof(data) == "string") {
                localStorage.setItem("token", data);
                window.location.href = "Myprofil.html";
            } else {
                displayError("Your credentials are incorrect");
            }
        })
        .catch(error => {
            console.error('Erreur lors de la requête :', error);
            displayError("An error occurred while trying to log in");
        });
};

function displayError(message) {
    let error = document.getElementById("error");
    error.textContent = message;
    error.style.color = "red";
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn");
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            let username = document.getElementById("username").value;
            let password = document.getElementById("password").value;
            credentials.username = username;
            credentials.password = password;
            login();
        });
    }
});
