var endpointGraphql = "https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql";
// URL du point de terminaison GraphQL

var token = localStorage.getItem("token");
// Récupère le jeton JWT depuis le localStorage
if (token == null){
    window.location.href = "index.html";
    // Redirige vers la page de connexion si le jeton n'est pas trouvé
}

// Déclare une requête GraphQL pour récupérer les informations utilisateur, les transactions et les audits
const graphqlQueryUser = `
query {
    user {
        id,
        login,
        profile,
        attrs
    }
    transaction(where: {type: {_eq: "xp"}, eventId:{_eq:56}, path:{_nlike:"/dakar/div-01/checkpoint/%"}},order_by:{createdAt:asc}) {
        id,
        amount,
        path,
        eventId,
        createdAt
    }
    xp: transaction_aggregate(where: {type: {_eq: "xp"}, eventId:{_eq:56}}) {
        aggregate {
            sum {
                amount
            }
        }
    }
    up_sum: transaction_aggregate(where: {type: {_eq: "up"}, path: {_like: "/dakar/div-01%"}}) {
        aggregate {
            sum {
                amount
            }
        }
    }
    down_sum: transaction_aggregate(where: {type: {_eq: "down"}, path: {_like: "/dakar/div-01%"}}) {
        aggregate {
            sum {
                amount
            }
        }
    }
    grade: transaction(where: {type: {_eq: "level"}, path: {_like: "/dakar/div-01%"}}, order_by: {id: desc}, limit: 1) {
        amount
    }
    fail: audit(where: {grade: {_lt : 1}}, order_by: {createdAt: asc}) {
        createdAt,
        auditorId,
        grade
    }
    pass: audit(where: {grade: {_gte : 1}}, order_by: {createdAt: asc}) {
        createdAt,
        auditorId,
        grade
    }
}
`;

const ConvertXp = (xp) => {
    // Convertit une valeur d'XP en une chaîne lisible avec des unités
    if (xp < 1000) {
        return (Math.round(xp)).toString() + "B";
    } else if (xp < 1000000) {
        return (Math.round(xp * 0.001)).toString() + "KB";
    } else {
        return (Math.round(xp * 0.0001)).toString() + "MB";
    }
}

const ConvertXpBar = (xp) => {
    // Convertit une valeur d'XP en une chaîne lisible avec des unités, avec une décimale
    if (xp < 1000) {
        return xp.toFixed(1).toString() + "B";
    } else if (xp < 1000000) {
        return ((xp * 0.001).toFixed(1)).toString() + "KB";
    } else {
        return (xp * 0.0001).toFixed(1).toString() + "MB";
    }
}

const changeToPourcent = (tab) => {
    // Convertit un tableau de valeurs en pourcentages
    let total = 0;
    let newTab = [];
    tab.forEach((e) => {
        total += Math.round(e);
    });
    tab.forEach((e) => {
        newTab.push((Math.round(e) / total) * 100);
    });
    return newTab;
}

const GraphqlData = () => {
    // Effectue une requête POST à l'endpoint GraphQL pour récupérer les données utilisateur et les transactions
    fetch(endpointGraphql, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: graphqlQueryUser })
    })
        .then(response => response.json())
        .then(data => {
            let fail = [];
            let pass = [];

            // Filtre les audits en échec et réussis pour l'utilisateur actuel
            data.data.fail.forEach(e => {
                if (e.auditorId == data.data.user[0].id) {
                    fail.push(e);
                }
            });
            data.data.pass.forEach(e => {
                if (e.auditorId == data.data.user[0].id) {
                    pass.push(e);
                }
            });

            // Convertit les nombres d'échecs et de réussites en pourcentages et dessine un diagramme circulaire
            let tab = changeToPourcent([fail.length, pass.length]);
            drawPieChart(tab, 150, 150, 100);

            // Prépare les données pour le diagramme en barres
            let NameProject = [];
            let amount = [];
            data.data.transaction.forEach((e) => {
                let tab = e.path.split("/");
                if (tab[tab.length - 1] != "piscine-js-2"){
                    amount.push(e.amount);
                    NameProject.push(tab[tab.length - 1]);
                }
            });
            let tab2 = changeToPourcent(amount);
            let xps = [];
            amount.forEach((e) => {
                xps.push(ConvertXpBar(e));
            });

            // Crée les données pour le diagramme en barres
            const datas = [];
            NameProject.forEach((e, i) => {
                datas.push({ label: e, value: tab2[i], xp: xps[i] });
            });

            // Dessine le diagramme en barres
            drawBarChart(datas, 50, 100, 250, 100);

            // Met à jour l'interface utilisateur avec les informations utilisateur
            let profile = document.getElementById("username");
            let grade = document.getElementById("grade");
            let audit = document.getElementById("audit");
            let xp = document.getElementById("xpUser");

            profile.textContent = data.data.user[0].login;
            xp.textContent = ConvertXp(data.data.xp.aggregate.sum.amount);
            audit.textContent = (data.data.up_sum.aggregate.sum.amount / data.data.down_sum.aggregate.sum.amount).toFixed(1);
            grade.textContent = data.data.grade[0].amount;

            // Met à jour l'interface utilisateur avec les informations personnelles
            let prenom = document.getElementById("Prenom");
            let nom = document.getElementById("Nom");
            let age = document.getElementById("Age");
            let email = document.getElementById("Email");
            prenom.textContent = data.data.user[0].attrs.firstName;
            nom.textContent = data.data.user[0].attrs.lastName;
            age.textContent = data.data.user[0].attrs.age;
            email.textContent = data.data.user[0].attrs.email;
        })
        .catch(error => {
            console.error('Erreur lors de la requête GraphQL user:', error);
            window.location.href = "index.html";
            // Redirige vers la page de connexion en cas d'erreur
        });
}

// Fonction pour dessiner le diagramme circulaire
function drawPieChart(data, cx, cy, radius) {
    let totalPercentage = 0;
    data.forEach(item => totalPercentage += item);

    let startAngle = -Math.PI / 2;
    var i = 0;

    data.forEach(item => {
        const endAngle = startAngle + (item / totalPercentage) * (Math.PI * 2);
        const largeArcFlag = item > 50 ? 1 : 0;
        const startX = cx + Math.cos(startAngle) * radius;
        const startY = cy + Math.sin(startAngle) * radius;
        const endX = cx + Math.cos(endAngle) * radius;
        const endY = cy + Math.sin(endAngle) * radius;

        // Crée un élément path SVG pour chaque portion du diagramme
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`);
        let labels = (i == 0) ? "Fail" : "Pass";
        path.id = labels;
        path.setAttribute("fill", getRandomColor());
        path.addEventListener("mouseover", function() {
            mouseover(labels);
        });
        path.addEventListener("mouseout", function() {
            mouseout(labels);
        });
        document.getElementById("pie-chart").appendChild(path);

        // Crée un élément texte SVG pour chaque label
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const midX = cx + Math.cos(midAngle) * (radius / 2);
        const midY = cy + Math.sin(midAngle) * (radius / 2);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", midX);
        label.setAttribute("y", midY);
        label.id = "label" + labels;
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        const angleDeg = (midAngle * 180) / Math.PI;
        label.setAttribute("transform", `rotate(${angleDeg}, ${midX}, ${midY})`);
        label.style = "display:none;";
        label.textContent = labels + " " + Math.round(item) + "%";
        i++;
        document.getElementById("pie-chart").appendChild(label);

        startAngle = endAngle;
    });
}

// Fonction pour générer une couleur aléatoire
function getRandomColor() {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    const color = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    return color;
}

// Fonction pour dessiner le diagramme en barres
function drawBarChart(data, x, y, width, height) {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    const barWidth = (width / data.length);

    data.forEach((item, index) => {
        const barHeight = ((item.value / total) * height) * 5;
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.id = item.label;
        bar.addEventListener("mouseover", function() {
            mouseOverBar(item.label);
        });
        bar.addEventListener("mouseout", function() {
            mouseout(item.label);
        });
        bar.setAttribute("x", x + index * barWidth);
        bar.setAttribute("y", y + (height - barHeight));
        bar.setAttribute("width", barWidth);
        bar.setAttribute("height", barHeight);
        bar.setAttribute("fill", getRandomColor());
        document.getElementById("bar-chart").appendChild(bar);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x + index * barWidth + barWidth / 2);
        label.setAttribute("y", y + (height - barHeight) - 5);
        label.setAttribute("text-anchor", "middle");
        label.id = "label" + item.label;
        label.textContent = item.label + " " + item.xp;
        label.style = "font-size:3px; display:none";
        document.getElementById("bar-chart").appendChild(label);
    });
}

// Fonction pour afficher un label lors du survol d'une portion du diagramme
function mouseover(id) {
    let label = document.getElementById("label" + id);
    if (label != null) {
        label.style.display = "block";
        label.style.fontSize = "90%";
        label.style.fontWeight = "bolder";
        console.log(label.textContent);
    }
}

// Fonction pour afficher un label lors du survol d'une barre du diagramme
function mouseOverBar(id) {
    let label = document.getElementById("label" + id);
    if (label != null) {
        label.style.display = "block";
        label.style.fontSize = "90%";
        label.style.fontWeight = "bolder";
        label.setAttribute("x", 100);
    }
}

// Fonction pour cacher un label lorsqu'une section du diagramme n'est plus survolée
function mouseout(id) {
    let label = document.getElementById("label" + id);
    if (label != null) {
        label.style.display = "none";
    }
}
function preventBack() {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, "", window.location.href);
    };
}

// Fonction pour déconnecter l'utilisateur
function Logout() {
    localStorage.removeItem('token');
    window.location.href = "index.html";
}

// Appelle la fonction GraphqlData pour récupérer et afficher les données lors du chargement de la page
GraphqlData();

// Empêche l'utilisateur de revenir en arrière après la connexion
preventBack();
