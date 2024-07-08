var endpointGraphql = "https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql";
var token = localStorage.getItem("token");
if (token == null){
    window.location.href = "index.html"
}
//test queryGraphql
const graphqlQueryUser = `
query {
    user{
        id,
        login,
        profile,
        attrs
    }  
    transaction(where: {type: {_eq: "xp"}, eventId:{_eq:56}, path:{_nlike:"/dakar/div-01/checkpoint/%"}},order_by:{createdAt:asc}){
        id,
        amount,
        path,
        eventId
        createdAt,
    }
    xp: transaction_aggregate(where: {type: {_eq: "xp"}, eventId:{_eq:56}}) {
        aggregate{
            sum{
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
    grade:  transaction(where: {type: {_eq: "level"}, path: {_like: "/dakar/div-01%"}}, order_by: {id: desc}, limit: 1) {
        amount
    }
    fail : audit (where:{grade:{_lt : 1}}, order_by:{createdAt:asc}){
        createdAt,
        auditorId,
        grade 
    }
    pass : audit (where:{grade:{_gte : 1}}, order_by:{createdAt:asc}){
        createdAt,
        auditorId,
        grade
    }
}
`;

const ConvertXp = (xp) => {
    if (xp < 1000) {
        return (Math.round(xp)).toString() + "B"
    } else if (xp < 1000000) {
        return (Math.round(xp * 0.001)).toString() + "KB"
    } else {
        return (Math.round(xp * 0.0001)).toString() + "MB"
    }
}

const ConvertXpBar = (xp) => {
    if (xp < 1000) {
        return xp.toFixed(1).toString() + "B"
    } else if (xp < 1000000) {
        return ((xp * 0.001).toFixed(1)).toString() + "KB"
    } else {
        return (xp * 0.0001).toFixed(1).toString() + "MB"
    }
}

const changeToPourcent = (tab) => {
    // Calcul de la somme des deux nombres
    let total = 0;
    let newTab = [];
    tab.forEach((e) => {
        total += Math.round(e)
    });
    tab.forEach((e) => {
        newTab.push((Math.round(e) / total) * 100)
    });

    return newTab
}

const GraphqlData = () => {
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

            data.data.fail.forEach(e => {
                if (e.auditorId == data.data.user[0].id) {
                    fail.push(e)
                }
            });
            data.data.pass.forEach(e => {
                if (e.auditorId == data.data.user[0].id) {
                    pass.push(e)
                }
            });

            // Appel de la fonction pour dessiner le diagramme
            let tab = changeToPourcent([fail.length, pass.length])
            drawPieChart(tab, 150, 150, 100);
            let NameProject = [];
            let amount = []
            data.data.transaction.forEach((e) => {
                let tab = e.path.split("/")
                if (tab[tab.length -1] != "piscine-js-2"){
                    amount.push(e.amount)
                    NameProject.push(tab[tab.length - 1])
                }
            })
            let tab2 = changeToPourcent(amount)
            let xps = [];
            amount.forEach((e)=>{
                console.log(e);
                xps.push(ConvertXpBar(e))
            })
            // Exemple de données
            const datas = [];
            NameProject.forEach((e, i) => {
                datas.push({ label: e, value: tab2[i], xp : xps[i] })
            })

            // Appel de la fonction pour dessiner le diagramme en barres
            drawBarChart(datas, 50, 100, 250, 100);

            // information talent
            let profile = document.getElementById("username")
            let grade = document.getElementById("grade")
            let audit = document.getElementById("audit")
            let xp = document.getElementById("xpUser")

            profile.textContent = data.data.user[0].login
            xp.textContent = ConvertXp(data.data.xp.aggregate.sum.amount);
            audit.textContent = (data.data.up_sum.aggregate.sum.amount / data.data.down_sum.aggregate.sum.amount).toFixed(1);
            grade.textContent = data.data.grade[0].amount;

            //information personnelle
            let prenom = document.getElementById("Prenom")
            let nom = document.getElementById("Nom")
            let age = document.getElementById("Age")
            let email = document.getElementById("Email")
            prenom.textContent = data.data.user[0].attrs.firstName
            nom.textContent = data.data.user[0].attrs.lastName
            age.textContent = data.data.user[0].attrs.age
            email.textContent = data.data.user[0].attrs.email
        })
        .catch(error => {
            console.error('Erreur lors de la requête GraphQL user:', error);
            window.location.href = "index.html"
        });
}

// Fonction pour dessiner le diagramme circulaire
function drawPieChart(data, cx, cy, radius) {
    let totalPercentage = 0;
    data.forEach(item => totalPercentage += item);

    let startAngle = -Math.PI / 2; // Angle de départ
    var i = 0;

    data.forEach(item => {
        const endAngle = startAngle + (item / totalPercentage) * (Math.PI * 2); // Angle de fin
        const largeArcFlag = item > 50 ? 1 : 0; // Drapeau pour spécifier si l'arc est supérieur à 180 degrés

        // Calcul des coordonnées de début et de fin de l'arc
        const startX = cx + Math.cos(startAngle) * radius;
        const startY = cy + Math.sin(startAngle) * radius;
        const endX = cx + Math.cos(endAngle) * radius;
        const endY = cy + Math.sin(endAngle) * radius;

        // Construction du chemin SVG pour l'arc
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`);
        let labels = "";
        if (i == 0) {
            labels = "Fail";
        } else {
            labels = "Pass";
        }
        path.id = labels;
        path.setAttribute("fill", getRandomColor()); // Couleur aléatoire pour chaque portion

        path.addEventListener("mouseover", function() {
            mouseover(labels)
        });
        path.addEventListener("mouseout", function() {
            mouseout(labels)
        });

        document.getElementById("pie-chart").appendChild(path);

        // Calcul du point central de l'arc
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const midX = cx + Math.cos(midAngle) * (radius / 2);
        const midY = cy + Math.sin(midAngle) * (radius / 2);

        // Création de l'élément texte
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", midX);
        label.setAttribute("y", midY);
        label.id = "label" + labels;
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");

        // Calcul de l'angle de rotation
        const angleDeg = (midAngle * 180) / Math.PI;

        // Appliquer l'angle de rotation au texte
        label.setAttribute("transform", `rotate(${angleDeg}, ${midX}, ${midY})`);

        label.style = "display:none;";
        label.textContent = labels + " " + Math.round(item) + "%";
        i++;
        document.getElementById("pie-chart").appendChild(label);

        startAngle = endAngle; // Met à jour l'angle de départ pour la prochaine portion
    });
}


// Fonction pour générer une couleur aléatoire
function getRandomColor() {
    // Générer des composantes de couleur R, G, B dans une plage spécifique
    const r = Math.floor(Math.random() * 200); // Valeur de rouge entre 0 et 200
    const g = Math.floor(Math.random() * 200); // Valeur de vert entre 0 et 200
    const b = Math.floor(Math.random() * 200); // Valeur de bleu entre 0 et 200

    // Convertir les composantes RGB en format hexadécimal
    const color = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');

    return color;
}

function drawBarChart(data, x, y, width, height) {
    // Calcul de la somme totale des valeurs
    const total = data.reduce((acc, item) => acc + item.value, 0);

    // Calcul de la largeur de chaque barre
    const barWidth = (width / data.length);

    // Dessine chaque barre et ajoute le texte correspondant
    data.forEach((item, index) => {
        // Calcul de la hauteur de la barre en fonction du pourcentage de la valeur
        const barHeight = ((item.value / total) * height)*5;

        // Création de l'élément rect pour la barre
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.id=item.label
        bar.addEventListener("mouseover", function(){
            mouseOverBar(item.label)
        })
        bar.addEventListener("mouseout", function(){
            mouseout(item.label)
        })

        bar.setAttribute("x", x + index * barWidth);
        bar.setAttribute("y", y + (height - barHeight));
        bar.setAttribute("width", barWidth);
        bar.setAttribute("height", barHeight);
        bar.setAttribute("fill", getRandomColor());
        document.getElementById("bar-chart").appendChild(bar);

        // Création de l'élément texte pour afficher la valeur
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x + index * barWidth + barWidth / 2);
        label.setAttribute("y", y + (height - barHeight) - 5);
        label.setAttribute("text-anchor", "middle");
        label.id="label"+item.label;
        label.textContent = item.label + " " + item.xp;
        label.style = "font-size:3px; display:none"
        document.getElementById("bar-chart").appendChild(label);
    });
}
function mouseover(id){
    let label = document.getElementById("label"+id)
    if (label != null){
        label.style.display="block";
        label.style.fontSize="90%";
        label.style.fontWeight="bolder";
        // label.style.zIndex= 7
        console.log(label.textContent)
    }
}
function mouseOverBar(id){
    let label = document.getElementById("label"+id)
    if (label != null){
        label.style.display="block";
        label.style.fontSize="90%";
        label.style.fontWeight="bolder";
        label.setAttribute("x", 100);
    }
}
function mouseout(id){
    let label = document.getElementById("label"+id)
    if (label != null){
        label.style.display="none"
    }
}
function Logout(){
    localStorage.removeItem('token');
    window.location.href="index.html"
}

GraphqlData();