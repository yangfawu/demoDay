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
let USER_LOGGED_IN = false;
auth.onAuthStateChanged(user => {
    if (user) {
        USER_LOGGED_IN = true;
    } else {
        USER_LOGGED_IN = false;
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

    function newRecipeBox(recipe, RECIPE_ID) {
        let i = document.createElement("img");
        let THUMBNAIL_SRC;
        storage.ref(`${recipe.thumbnail}`).getDownloadURL().then(result => {
            i.src = result;
            THUMBNAIL_SRC = result;
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
            var RECIPE_SUMMARY = document.querySelector(".recipe-summary");
            var childsToAppend = [];


            // when user selects a recipe
            document.querySelector(".search-form").style.display = "none";
            document.querySelector(".results-box").style.display = "none";
            RECIPE_SUMMARY.style.display = "block";
            RECIPE_SUMMARY.innerHTML = "";


            // recipe-summary-head
            var rsh = document.createElement("div");
            rsh.setAttribute("class", "recipe-summary-head");

            var rsht = document.createElement("h1");
            rsht.setAttribute("class", "recipe-summary-head-title");
            rsht.innerHTML = recipe.name;

            var rshd = document.createElement("h2");
            rshd.setAttribute("class", "recipe-summary-head-date");
            rshd.innerHTML = "Uploaded on " + (new Date(parseInt(recipe.date)).toDateString()) + " by User";
            firebase.database().ref(`users/${recipe.user}`).once('value')
            .then(snapshot => {
                var info = rshd.innerHTML.split(" ");
                info[info.length - 1] = `${snapshot.val().name.first} ${snapshot.val().name.last}`;

                rshd.innerHTML = info.join(" ");
            })
            .catch(err => errorAlert(err));

            var rshp = document.createElement("p");
            rshp.setAttribute("class", "recipe-summary-head-description");
            rshp.innerHTML = recipe.description;

            rsh.appendChild(rsht);
            rsh.appendChild(rshd);
            rsh.appendChild(rshp);

            childsToAppend.push(rsh);


            // recipe-summary-thumbnail
            var rst = document.createElement("div");
            rst.setAttribute("class", "recipe-summary-thumbnail");

            var rsti = document.createElement("img");
            rsti.src = THUMBNAIL_SRC;

            rst.appendChild(rsti);

            childsToAppend.push(rst);


            // recipe-summary-ingredients
            var rsi = document.createElement("div");
            rsi.setAttribute("class", "recipe-summary-ingredients");

            var rsih = document.createElement("h1");
            rsih.innerHTML = "Ingredients:";
            rsi.appendChild(rsih);

            var rsiul = document.createElement("ul");
            var ingreds = recipe.ingredients;
            for (key in ingreds) {
                var ingred = ingreds[key];
                var li = document.createElement("li");
                li.innerHTML = `${ingred.name} (${ingred.quantity})`;

                rsiul.appendChild(li);
            }

            rsi.appendChild(rsiul);

            childsToAppend.push(rsi);


            // recipe-summary-instruction
            var rsin = document.createElement("div");
            rsin.setAttribute("class", "recipe-summary-instruction");

            var rsinh = document.createElement("h1");
            rsinh.innerHTML = "Steps:";
            rsin.appendChild(rsinh);

            var steps = [];
            for (key in recipe.instructions) {
                var s = recipe.instructions[key];
                steps[parseInt(s.step) - 1] = {
                    text: s.text,
                    url: s.url
                };
            }

            for (var i=0; i<steps.length; i++) {
                var sc = document.createElement("div");
                sc.setAttribute("class", "recipe-summary-instruction-step-box");

                var sch = document.createElement("h1");
                sch.innerHTML = `Step ${i + 1}`;

                var scp = document.createElement("p");
                scp.innerHTML = steps[i].text;

                sc.appendChild(sch);
                sc.appendChild(scp);

                if (steps[i].url !== "NO_URL") {
                    var scim = document.createElement("img");
                    storage.ref(`${steps[i].url}`).getDownloadURL().then(result => {
                        scim.src = result;
                    }).catch(err => errorAlert(err));

                    sc.appendChild(scim);
                }

                rsin.appendChild(sc);
            }

            childsToAppend.push(rsin);


            // recipe-summary-review
            var rsr = document.createElement("div");
            rsr.setAttribute("class", "recipe-summary-review");


            // recipe-summary-review-community
            var rsrc = document.createElement("div");
            rsrc.setAttribute("class", "recipe-summary-review-community");

            // recipe-summary-review-community-stats
            var rsrcs = document.createElement("div");
            rsrcs.setAttribute("class", "recipe-summary-review-community-stats");
            
            var rsrh = document.createElement("h1");
            rsrh.innerHTML = "Community Review:";
            rsr.appendChild(rsrh);

            var rsrpR = document.createElement("p");
            rsrpR.innerHTML = `Average Rating: #`;

            var rsrpL = document.createElement("p");
            rsrpL.innerHTML = `There are currently # community raters on this recipe.`;

            var raters = Object.values(recipe.reviews.community.raters);
            if (raters.length < 2) {
                rsrpR.innerHTML = `Average Rating: N/A`;
                rsrpL.innerHTML = `There are currently 0 community raters on this recipe.`;
            } else if (raters.length >= 2) {
                for (var i=0, sum=0; i<raters.length; i++) {
                    if (raters[i].id !== "NO_ID") sum+= parseInt(raters[i].rating);
                }
                rsrpR.innerHTML = `Average Rating: ${(sum/(raters.length-1)).toFixed(1)}`;
                rsrpL.innerHTML = `There ${(raters.length-1 == 0 || raters.length-1 > 1) ? "are" : "is"} currently ${raters.length - 1} community rater${(raters.length-1 == 1) ? "" : "s"} on this recipe.`;
            }

            rsrcs.appendChild(rsrh);
            rsrcs.appendChild(rsrpR);
            rsrcs.appendChild(rsrpL);

            rsrc.appendChild(rsrcs);

            // recipe-summary-review-community-personal
            var rsrcp = document.createElement("div");
            rsrcp.setAttribute("class", "recipe-summary-review-community-personal");

            if (USER_LOGGED_IN) {
                database.ref(`recipes/${RECIPE_ID}/reviews/community/raters`).once("value")
                .then(snapshot => {
                    var raters = Object.values(snapshot.val());
                    if (raters.filter(rater => rater.id == auth.getUid()).length < 1) {
                        // no review from the user
                        var rsrcph = document.createElement("h1");
                        rsrcph.innerHTML = "Give your own community rating for this recipe!";
                        rsrcp.appendChild(rsrcph);
        
                        var rsrcpb = document.createElement("button");
                        rsrcpb.innerHTML = "Give my community review";
        
                        var rsrcpForm = document.createElement("form");
        
                        var ratingBox = document.createElement("div");
                        var ratingBoxH = document.createElement("h1");
                        ratingBoxH.innerHTML = "Rating out of 5 stars";
                        ratingBox.appendChild(ratingBoxH);
        
                        var ratingBoxS = document.createElement("select");
                        for (var i=0; i<6; i++) {
                            var ratingBoxO = document.createElement("option");
                            ratingBoxO.setAttribute("value", i);
                            ratingBoxO.innerHTML = `${i} Stars`;
        
                            ratingBoxS.appendChild(ratingBoxO);
                        }
                        ratingBox.appendChild(ratingBoxS);
        
                        rsrcpForm.appendChild(ratingBox);
                        rsrcpForm.style.display = "none";
        
                        var comReSubmitBTN = document.createElement("button");
                        comReSubmitBTN.innerHTML = "Submit Community Review";
                        comReSubmitBTN.onclick = function() {
                            event.preventDefault();
                            var COMMUNITY_RATING = ratingBoxS.value;
                            database.ref(`users/${auth.getUid()}/ratings/submissions`).push({
                                id: RECIPE_ID,
                                type: "COMMUNITY"
                            }, err => {
                                if (err) errorAlert(err)
                            });
                            var UPDATE = {
                                id: auth.getUid(),
                                rating: COMMUNITY_RATING
                            };
                            database.ref(`recipes/${RECIPE_ID}/reviews/community/raters`).push(
                                UPDATE, err => { if (err) errorAlert(err) }
                            );

                            raters = [...raters, UPDATE];
                            for (var i=0, sum=0; i<raters.length; i++) {
                                if (raters[i].id !== "NO_ID") sum+= parseInt(raters[i].rating);
                            }
                            rsrpR.innerHTML = `Average Rating: ${(sum/(raters.length-1)).toFixed(1)}`;
                            rsrpL.innerHTML = `There ${(raters.length-1 == 0 || raters.length-1 > 1) ? "are" : "is"} currently ${raters.length - 1} community rater${(raters.length-1 == 1) ? "" : "s"} on this recipe.`;
                            
                            var rsrcpFormCONFIRM = document.createElement("p");
                            rsrcpFormCONFIRM.innerHTML = "Thank you for your review";
                            rsrcpForm.innerHTML = "";
                            rsrcpForm.appendChild(rsrcpFormCONFIRM);
                        }
                        rsrcpForm.appendChild(comReSubmitBTN);
        
                        rsrcpb.onclick = function() {
                            rsrcpForm.style.display = "block";
                            rsrcpb.style.display = "none";
                        }
                        rsrcp.appendChild(rsrcpb);
        
                        rsrcp.appendChild(rsrcpForm);
                    } else {
                        var ALREADY_RATED_P = document.createElement("p");
                        ALREADY_RATED_P.innerHTML = "You have already gave a community review to this recipe."

                        rsrcp.appendChild(ALREADY_RATED_P);
                    } 
                })
                .catch(err => {
                    if (err) {
                        errorAlert(err);
                        var FAIL_RSR_P = document.createElement("p");
                        FAIL_RSR_P.innerHTML = "Failed To Load Review Form. Please try again later."

                        rsrcp.appendChild(FAIL_RSR_P);
                    }
                })
            } else {
                var rsrcpa = document.createElement("a");
                rsrcpa.setAttribute("href", "../login/index.html");
                rsrcpa.innerHTML = "Go Login To Leave a Review";

                rsrcp.appendChild(rsrcpa);
            }

            rsrc.appendChild(rsrcp);

            rsr.appendChild(rsrc); // add community review section



            // recipe-summary-review-photo
            var rsrp = document.createElement("div");
            rsrp.setAttribute("class", "recipe-summary-review-photo");

            // recipe-summary-review-photo-stats
            var rsrps = document.createElement("div");
            rsrps.setAttribute("class", "recipe-summary-review-photo-stats");
            
            var rsrpsh = document.createElement("h1");
            rsrpsh.innerHTML = "Photo Review:";
            rsrps.appendChild(rsrpsh);

            var rsrpsR = document.createElement("p");
            rsrpsR.innerHTML = `Average Rating: #`;

            var rsrpsL = document.createElement("p");
            rsrpsL.innerHTML = `There are currently # photo raters on this recipe.`;

            var RATERS = Object.values(recipe.reviews.photo.raters);
            if (RATERS.length < 2) {
                rsrpsR.innerHTML = `Average Rating: N/A`;
                rsrpsL.innerHTML = `There are currently 0 photo raters on this recipe.`;
            } else if (RATERS.length >= 2) {
                for (var i=0, SUM=0; i<RATERS.length; i++) {
                    if (RATERS[i].id !== "NO_ID") SUM+= parseInt(RATERS[i].rating);
                }
                rsrpsR.innerHTML = `Photo Rating: ${(SUM/(RATERS.length-1)).toFixed(1)}`;
                rsrpsL.innerHTML = `There ${(RATERS.length-1 == 0 || RATERS.length-1 > 1) ? "are" : "is"} currently ${RATERS.length - 1} photo rater${(RATERS.length-1 == 1) ? "" : "s"} on this recipe.`;
            }

            rsrps.appendChild(rsrpsh);
            rsrps.appendChild(rsrpsR);
            rsrps.appendChild(rsrpsL);

            rsrp.appendChild(rsrps);

            // recipe-summary-review-community-personal
            var rsrpp = document.createElement("div");
            rsrpp.setAttribute("class", "recipe-summary-review-community-personal");

            if (USER_LOGGED_IN) {
                database.ref(`recipes/${RECIPE_ID}/reviews/photo/raters`).once("value")
                .then(snapshot => {
                    var raters = Object.values(snapshot.val());
                    if (raters.filter(rater => rater.id == auth.getUid()).length < 1) {
                        // no review from the user
                        var rsrpph = document.createElement("h1");
                        rsrpph.innerHTML = "Give your own photo rating for this recipe!";
                        rsrpp.appendChild(rsrpph);
        
                        var rsrppb = document.createElement("button");
                        rsrppb.innerHTML = "Give my photo review";
        
                        var rsrppForm = document.createElement("form");
        
                        var ratingBox = document.createElement("div");
                        var ratingBoxH = document.createElement("h1");
                        ratingBoxH.innerHTML = "Rating out of 5 stars";
                        ratingBox.appendChild(ratingBoxH);
        
                        var ratingBoxS = document.createElement("select");
                        for (var i=0; i<6; i++) {
                            var ratingBoxO = document.createElement("option");
                            ratingBoxO.setAttribute("value", i);
                            ratingBoxO.innerHTML = `${i} Stars`;
        
                            ratingBoxS.appendChild(ratingBoxO);
                        }
                        ratingBox.appendChild(ratingBoxS);
        
                        rsrppForm.appendChild(ratingBox);
                        rsrppForm.style.display = "none";

                        var ratingPhoto = document.createElement("div");
                        var ratingPhotoH = document.createElement("h1");
                        ratingPhotoH.innerHTML = "Attach A Photo Of the Meal You Made with the Recipe";
                        ratingPhoto.appendChild(ratingPhotoH);

                        var ratingPhotoI = document.createElement("input");
                        ratingPhotoI.setAttribute("type", "file");
                        ratingPhotoI.setAttribute("accept", "image/png, image/jpeg");
                        ratingPhoto.appendChild(ratingPhotoI);
                        rsrppForm.appendChild(ratingPhoto);

                        var ratingReason = document.createElement("div");
                        var ratingReasonH = document.createElement("h1");
                        ratingReasonH.innerHTML = "Reason for Review";
                        ratingReason.appendChild(ratingReasonH);

                        var ratingReasonI = document.createElement("input");
                        ratingReasonI.setAttribute("type", "text");
                        ratingReason.appendChild(ratingReasonI);
                        rsrppForm.appendChild(ratingReason);

                        var comReSubmitBTN = document.createElement("button");
                        comReSubmitBTN.innerHTML = "Submit Photo Review";
                        comReSubmitBTN.onclick = function() {
                            event.preventDefault();
                            var PHOTO_RATING = ratingBoxS.value;
                            database.ref(`users/${auth.getUid()}/ratings/submissions`).push({
                                id: RECIPE_ID,
                                type: "PHOTO"
                            }, err => {
                                if (err) errorAlert(err)
                            });

                            var photoFile = ratingPhotoI.files[0];
                            var photoWritten = ratingReasonI.value.trim();

                            if (!photoFile) return errorAlert("You must attach a photo for a photo review.");
                            if (photoWritten.length == 0) return errorAlert("You must write a reason for a photo review.");

                            var photoUrl = `images/${RECIPE_ID}/${auth.getUid()}/${photoFile.name}`;
                            storage.ref().child(photoUrl).put(photoFile)
                            .then(snapshot => {
                                console.log(snapshot);
                            })
                            .catch(err => { if (err) errorAlert(err); })

                            var UPDATE = {
                                id: auth.getUid(),
                                rating: PHOTO_RATING,
                                written: (ratingReasonI.value.trim()),
                                url: `images/${RECIPE_ID}/${auth.getUid()}/${photoFile.name}`
                            };
                            database.ref(`recipes/${RECIPE_ID}/reviews/photo/raters`).push(
                                UPDATE, err => { if (err) errorAlert(err) }
                            );

                            RATERS = [...RATERS, UPDATE];
                            for (var i=0, sum=0; i<RATERS.length; i++) {
                                if (RATERS[i].id !== "NO_ID") sum+= parseInt(RATERS[i].rating);
                            }
                            rsrpsR.innerHTML = `Photo Rating: ${(sum/(RATERS.length-1)).toFixed(1)}`;
                            rsrpsL.innerHTML = `There ${(RATERS.length-1 == 0 || RATERS.length-1 > 1) ? "are" : "is"} currently ${RATERS.length - 1} photo rater${(RATERS.length-1 == 1) ? "" : "s"} on this recipe.`;

                            var rsrppFormCONFIRM = document.createElement("p");
                            rsrppFormCONFIRM.innerHTML = "Thank you for your review";
                            rsrppForm.innerHTML = "";
                            rsrppForm.appendChild(rsrppFormCONFIRM);
                        }
                        rsrppForm.appendChild(comReSubmitBTN);
        
                        rsrppb.onclick = function() {
                            rsrppForm.style.display = "block";
                            rsrppb.style.display = "none";
                        }
                        rsrpp.appendChild(rsrppb);
        
                        rsrpp.appendChild(rsrppForm);
                    } else {
                        var ALREADY_RATED_P = document.createElement("p");
                        ALREADY_RATED_P.innerHTML = "You have already gave a community review to this recipe."

                        rsrpp.appendChild(ALREADY_RATED_P);
                    } 
                })
                .catch(err => {
                    if (err) {
                        errorAlert(err);
                        var FAIL_RSR_P = document.createElement("p");
                        FAIL_RSR_P.innerHTML = "Failed To Load Review Form. Please try again later."

                        rsrpp.appendChild(FAIL_RSR_P);
                    }
                })
            } else {
                var rsrppa = document.createElement("a");
                rsrppa.setAttribute("href", "../login/index.html");
                rsrppa.innerHTML = "Go Login To Leave a Review";

                rsrpp.appendChild(rsrppa);
            }
            
            rsrp.appendChild(rsrpp);


            // recipe-summary-review-photo-gallery
            var rsrpg = document.createElement("div");
            rsrpg.setAttribute("class", "recipe-summary-review-photo-gallery");

            var PHOTO_RATINGS = Object.values(recipe.reviews.photo.raters);
            if (PHOTO_RATINGS.length < 2) {
                var EMPTY_PHOTO_RESPONSE = document.createElement("p");
                EMPTY_PHOTO_RESPONSE.innerHTML = "This recipe currently doesn't have any photo reviews.";

                rsrpg.appendChild(EMPTY_PHOTO_RESPONSE);
            } else if (PHOTO_RATINGS.length >= 2) {
                for (var i=0; i<PHOTO_RATINGS.length; i++) {
                    var rating = PHOTO_RATINGS[i];
                    if (rating.id !== "NO_ID") {
                        var rsrpgpgb = document.createElement("div");
                        rsrpgpgb.setAttribute("class", "photo-gallery-box");

                        var rsrpgpgbi = document.createElement("img");
                        storage.ref(`${rating.url}`).getDownloadURL().then(result => {
                            rsrpgpgbi.src = result;
                        }).catch(err => errorAlert(err));

                        rsrpgpgb.appendChild(rsrpgpgbi);

                        var rsrpgpgbd = document.createElement("div");
                        rsrpgpgbd.setAttribute("class", "photo-gallery-box-testimony");
                        
                        var rsrpgpgbdR = document.createElement("p");
                        rsrpgpgbdR.innerHTML = `Rated ${rating.rating} out of 5 Stars`;

                        var rsrpgpgbdRe = document.createElement("p");
                        rsrpgpgbdRe.innerHTML = `"${rating.written}" - User`;

                        database.ref(`users/${rating.id}`).once("value")
                        .then(snapshot => {
                            var user = snapshot.val();
                            rsrpgpgbdRe.innerHTML = `"${rating.written}" - ${user.name.first} ${user.name.last}`;
                        })
                        .catch(err => { if (err) errorAlert(err) });

                        rsrpgpgbd.appendChild(rsrpgpgbdR);
                        rsrpgpgbd.appendChild(rsrpgpgbdRe);

                        rsrpgpgb.appendChild(rsrpgpgbd);

                        rsrpg.appendChild(rsrpgpgb);
                    }
                }
            }

            rsrp.appendChild(rsrpg);

            rsr.appendChild(rsrp); // add photo review section

            childsToAppend.push(rsr);

            // push all childs
            for (var i=0; i<childsToAppend.length; i++) RECIPE_SUMMARY.appendChild(childsToAppend[i]);
        }
    
        return rContainer;
    }

    for (var i=0; i<recipeKeys.length; i++) r.appendChild(newRecipeBox(recipes[`${recipeKeys[i]}`], recipeKeys[i]));

    document.querySelector(".results").style.display = "grid";
}