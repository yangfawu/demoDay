firebase.initializeApp({
    apiKey: "AIzaSyDGUvCzXt5Xd6HSHJ9-rCN_deEPD0BxILw",
    authDomain: "demoday-83180.firebaseapp.com",
    databaseURL: "https://demoday-83180.firebaseio.com",
    projectId: "demoday-83180",
    storageBucket: "demoday-83180.appspot.com",
    messagingSenderId: "655039030434",
    appId: "1:655039030434:web:b788265f1617bdf075a3fb"
});

const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Error
window.onclick = function() {
    var errorBox = document.querySelector(".error-box");
    if (event.target == errorBox) errorBox.style.display = "none";
};

document.querySelector(".error-content div").onclick = function() {
    document.querySelector(".error-box").style.display = "none";
}

var errorAlert = (msg = "Error Message.") => {
    document.querySelector(".error-box").style.display = "grid";
    document.querySelector(".error-msg").innerHTML = msg;
};



// Logged In Logistics
auth.onAuthStateChanged(user => {
    if (!user) {
        // User is not signed in.
    } else {
        // User is signed in.
    }
});

(function() {
    document.querySelector(".search-form").style.display = "block";
    document.querySelector(".results-box").style.display = "none";
    document.querySelector(".recipe-summary").style.display = "none";

    var iq = document.querySelector(".ingredient-query");
    iq.innerHTML = "";
    function a() { iq.appendChild(newIngredientBox()); }
    document.getElementById("moreBtn").onclick = function() {
        event.preventDefault();
        a();
    };
    a();

    document.getElementById("submitBtn").onclick = function() {
        event.preventDefault();
        queryRecipe();
    };
})();


// Form
function newIngredientBox() {
    var i = document.createElement("input");
    i.setAttribute("type", "text");

    var b = document.createElement("button");
    b.innerHTML = "Remove Ingredient";
    b.onclick = function() {
        event.preventDefault();
        var parent = b.parentNode,
            grandparent = parent.parentNode;

        // only if there is more than one ingredient box
        var ingredInputs = document.querySelectorAll(".ingredient-query div input[type = text]");
        if (ingredInputs.length > 1) grandparent.removeChild(parent);
        else errorAlert("You must search with at least one ingredient.");
    }

    var d = document.createElement("div");
    d.appendChild(i);
    d.appendChild(b);

    return d;
}

function queryRecipe() {
    var ingreds = document.querySelectorAll(".ingredient-query div input[type = text]");
    var ingredsInputs = Array.from(ingreds).map(input => input.value.toLowerCase());
    
    if (ingredsInputs.length < 1) return errorAlert("You must search with at least one ingredient.");
    else if (ingredsInputs.filter(input => input.length == 0).length > 0) return errorAlert("Not all the input fields are filled.");

    var iiCopy = ingredsInputs.slice();
    var iiText;
    switch (iiCopy.length) {
        case 1:
            iiText = iiCopy.join();
            break;
        case 2:
            iiText = iiCopy.join(" and/or ");
            break;
        default:
            iiCopy.splice(iiCopy.length-1, 0, "and/or");
            iiText = iiCopy.join(", ");
    }

    document.querySelector(".results-box").style.display = "block";
    document.querySelector(".results-box h3").innerHTML = `Searching our database for recipes that have ${iiText} in their ingredient lists...`; 
    document.querySelector(".results").style.display = "none";
    document.querySelector(".recipe-summary").style.display = "none";


    firebase.database().ref('recipes').once('value')
    .then(snapshot => {
        var recipes = snapshot.val();
        var matchKeys = [];

        // go through every recipe in the database
        for (rKey in recipes) {
            var recipe = recipes[rKey];
            var rIngreds = recipe.ingredients;

            var recipeIngreds = [];
            for (iKey in rIngreds) recipeIngreds.push(rIngreds[iKey].name);
            recipeIngreds = recipeIngreds.map(ingred => ingred.toLowerCase());

            if (recipeIngreds.length < ingredsInputs.length) {
                for (rIngred of recipeIngreds) {
                    if (ingredsInputs.includes(rIngred)) {
                        matchKeys.push(rKey);
                        break;
                    }
                }
            } else {
                for (iIngred of ingredsInputs) {
                    if (recipeIngreds.includes(iIngred)) {
                        matchKeys.push(rKey);
                        break;
                    }
                }
            }
        }

        displayMatches(matchKeys, recipes);
    })
    .catch(err => errorAlert(err));
}

function displayMatches(recipeKeys, recipes) {
    if (recipeKeys.length < 1) 
        return document.querySelector(".results-box h3").innerHTML = `We couldn't find any recipes in our database that had the ingredients you searched with. Our search engine is spelling-sensitive, so please check your spelling before trying again.`;
    else document.querySelector(".results-box h3").innerHTML = "Here are some recipes that we found based on the ingredients you gave us:"

    var r = document.querySelector(".results");
    r.innerHTML = "";

    function newRecipeBox(recipe) {
        let i = document.createElement("img");
        storage.ref(`${recipe.thumbnail}`).getDownloadURL().then(result => {
            i.src = result;
        }).catch(err => errorAlert(err));
    
        let h1 = document.createElement("h1");
        h1.innerHTML = recipe.name;
        let h2 = document.createElement("h2");
        h2.innerHTML = recipe.description;
        let h3 = document.createElement("h3");
        h3.innerHTML = "Uploaded on " + (new Date(parseInt(recipe.date)).toDateString());
        let infoContainer = document.createElement("div");
        infoContainer.setAttribute("class", "results-recipe-box-info");
        infoContainer.appendChild(h1);
        infoContainer.appendChild(h2);
        infoContainer.appendChild(h3);
    
        function reviewPara(obj, type) {
            let ratersKeys = Object.keys(obj.raters);
            let p = document.createElement("p");
            p.innerHTML = `${type} [${ratersKeys.length - 1} rater${(ratersKeys.length - 1 == 0 || ratersKeys.length - 1 > 1) ? "s" : ""}]: ${(ratersKeys.length < 2) ? "N/A" : (obj.average)}`;
    
            return p;
        }
    
        let reviewContainer = document.createElement("div");
        reviewContainer.appendChild(reviewPara(recipe.reviews.community, "Community"));
        reviewContainer.appendChild(reviewPara(recipe.reviews.photo, "Photo"));
    
        let rContainer = document.createElement("div");
        rContainer.setAttribute("class", "results-recipe-box");
        rContainer.appendChild(i);
        rContainer.appendChild(infoContainer);
        rContainer.appendChild(reviewContainer);

        rContainer.onclick = function() {
            // when user selects a recipe
            document.querySelector(".search-form").style.display = "none";
            document.querySelector(".results-box").style.display = "none";
            document.querySelector(".recipe-summary").style.display = "block";




            // finish this

            // add background user update js
        }
    
        return rContainer;
    }

    for (var i=0; i<recipeKeys.length; i++) r.appendChild(newRecipeBox(recipes[`${recipeKeys[i]}`]));

    document.querySelector(".results").style.display = "grid";
}