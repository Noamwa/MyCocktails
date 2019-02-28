window.onload = onReady;
const categoriesUrl = 'https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list';
const url = 'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=';
var drinksMap;
var myDrinksIds = [];

function onReady() {
    document.body.style.backgroundColor = "#9ce0ff";
    var drinks = [];
    drinksMap = new Map();
    getCategories()
        .then(categories => {
            Promise.all(categories.map(category => fetchDrinksByCategory(category)))
                .then(drinksPerCategoty => {
                    drinks = drinksPerCategoty.flat();
                    onDrinksInitialize(drinks);
                })//TODO .catch(...)
        });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        fetch(categoriesUrl).then(res => {
            if (!res) {
                reject();
            }
            else {
                return res.json()
            }
        }).then(categoriesJson => {
            resolve(categoriesJson.drinks.map(drink => drink.strCategory));
        });//TODO .catch(...)
    });
}

function onDrinksInitialize(drinks) {
    drinks.sort((a, b) => {
        a.name < b.name;
    }).forEach((drink, i) => {
        let ul;
        const drinkListItem = convertDrinkToDomElement(drink);
        if (i % 4 === 0) {
            let table = document.getElementById('table');
            ul = createDomNode('ul', table, null, 'class', 'row');
        }
        else {
            ul = document.getElementById('table').lastChild;
        }
        ul.appendChild(drinkListItem);
    });
}

function convertDrinkToDomElement(drink) {

    let li = createDomNode('li', '', '', 'class', 'card');
    let drinkName = createDomNode('span', li, drink.name, 'class', 'myFont');
    let image = createDomNode('div', li);
    let photo = createDomNode('img', image, '', 'src', drink.imageSrc);
    photo.setAttribute('class', 'img');
    let imgText = createDomNode('div', image, '', 'class', 'imageText');
    let icon = createDomNode('i', imgText, '', 'class', 'fas fa-angle-double-down');

    image.addEventListener('click', (e) => {
        fetchDrinkContent(drink)
            .then(drinkContent => {
                drink.setDrinkContent(drinkContent);
                let content = document.getElementsByClassName('content')[0];
                if (content) {
                    if (content.getAttribute('id') !== drink.id) {
                        handleContentCollapse(content, li);
                        content.remove();
                        content = createContentDomElement(drink);
                        content.setAttribute('id', drink.id);
                        document.getElementById('table').insertBefore(content, li.parentElement.nextElementSibling)
                    }
                }
                else {
                    content = createContentDomElement(drink);
                    content.setAttribute('id', drink.id);
                    document.getElementById('table').insertBefore(content, li.parentElement.nextElementSibling)
                }
                handleContentCollapse(content, li);
            })//TODO .catch(...)
    });
    return li;
}

function handleContentCollapse(content, li) {
    if (content.style.maxHeight) {
        content.previousSibling.childNodes.forEach(node => {
            node.getElementsByClassName('imageText')[0].firstChild.setAttribute('class', 'fas fa-angle-double-down');
        })
        content.style.display = 'none';
        content.style.padding = '0%';
        content.style.maxHeight = null;
        content.style.width = '0%';
    }
    else {
        content.style.display = 'block';
        li.getElementsByClassName('imageText')[0].firstChild.setAttribute('class', 'fas fa-angle-double-up');
        content.style.padding = '10%';
        content.style.width = '100%';
        content.style.maxHeight = `${content.scrollHeight +
            content.getElementsByTagName('ul')[0].getElementsByTagName('li').length * 60}px`;

    }
}

function fetchDrinksByCategory(category) {
    return new Promise((resolve, reject) => {
        fetch(url + category).then(res => {
            if (!res) {
                reject();
            }
            else {
                return res.json();
            }
        })
            .then(drinksJson => {
                resolve(drinksJson.drinks.map(drinkJson => {
                    let drink = new Drink(drinkJson.idDrink, drinkJson.strDrink,
                        drinkJson.strDrinkThumb, category);
                    drinksMap.set(drink.id, drink);
                    return drink;
                }
                ));
            });//TODO .catch(...)
    });
}

function DrinkContent(isAlcoholic, glass, ingredients, instructions) {
    this.isAlcoholic = isAlcoholic;
    this.glass = glass;
    this.ingredients = ingredients;
    this.instructions = instructions;
}
function Drink(id, name, imageSrc, category) {
    this.id = id;
    this.name = name;
    this.imageSrc = imageSrc;
    this.category = category;
}

Drink.prototype.setDrinkContent = function (drinkContent) {
    this.drinkContent = drinkContent;
}

function createContentDomElement(drink) {

    let content = createDomNode('div', '', '', "class", "content");
    let myList = createMyListElement(drink);
    content.appendChild(myList);
    let ingredientsHeader = createDomNode('b', content, '<br/>Ingredients :');
    let ingredients = createDomNode('ul', content);
    drink.drinkContent.ingredients.forEach(ingredient => {
        let DomIngredient = createDomNode('li', ingredients,
            `${ingredient.name} ${ingredient.quantity ? ingredient.quantity : ''}`);
        let img = createDomNode('img', DomIngredient, ingredient.image, 'src', ingredient.image);
        img.setAttribute('class', 'ingredient');
    });
    let isAlcoholic = createDomNode('span', content,
        'Alcoholic : ');
    let alcoholicIcon = createDomNode('i', isAlcoholic, '',
        'class', drink.isAlcoholic ? 'far fa-times-circle' : 'fas fa-check');
    let glass = createDomNode('span', content, `<br/>Glass : ${drink.drinkContent.glass}<br/>`);
    let instructionsHeader = createDomNode('b', content,
        drink.drinkContent.instructions ? 'Instructions :<br/>' : '');
    let instructions = createDomNode('span', content, drink.drinkContent.instructions);
    return content;
}

function createDomNode(type, father, innerHTML, attribute, attributeStr) {
    let newNode = document.createElement(type);
    if (father) father.appendChild(newNode);

    if (attribute) newNode.setAttribute(attribute, attributeStr);
    if (innerHTML) newNode.innerHTML = innerHTML;
    return newNode;
}

function createMyListElement(drink) {

    let myList = createDomNode('div', '', '', 'class', 'myList');
    let index = myDrinksIds.indexOf(drink.id);
    let myListButton = createDomNode('button', myList, '', 'class', 'myListButton');
    let text;
    if (index !== -1) {
        text = createDomNode('span', myListButton, 'Remove From My Drinks !');
        myListButton.style.backgroundColor = 'rgb(255, 53, 53)';
    }
    else {
        text = createDomNode('span', myListButton, 'Add To My Drinks !');
        myListButton.style.backgroundColor = 'rgb(255, 225, 92)';
    }
    let icon = createDomNode('i', text, '', 'class', 'fas fa-cocktail');
    addEventToMyListButton(myListButton, drink);
    return myList;

}

function addEventToMyListButton(myListButton, drink) {
    myListButton.addEventListener('click', (e) => {
        var index = myDrinksIds.indexOf(drink.id);
        if (index !== -1) {
            myDrinksIds.splice(index, 1);
            myListButton.firstChild.innerHTML = 'Add To My Drinks !';
            myListButton.style.backgroundColor = 'rgb(255, 225, 92)';
        }
        else {
            myListButton.firstChild.innerHTML = 'Remove From My Drinks !';
            myListButton.style.backgroundColor = 'rgb(255, 53, 53)';
            myDrinksIds.push(drink.id);
        }
        let icon = document.createElement('i');
        icon.setAttribute('class', 'fas fa-cocktail');
        myListButton.firstChild.appendChild(icon);
    });
}

function Ingredient(name, quantity, image) {
    this.name = name;
    this.quantity = quantity;
    this.image = image;
}

function fetchDrinkContent(drink) {
    return new Promise((resolve, reject) => {
        if (drink.drinkContent) {
            resolve(drink.drinkContent)
        }
        else {
            const url = 'https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=';
            fetch(url + drink.id)
                .then(response => {
                    if (!response) {
                        reject();
                    }
                    else {
                        return response.json()
                    }
                })
                .then(contentJson =>
                    resolve(createDrinkInfo(contentJson.drinks[0]))
                );//TODO .catch(...)
        }
    })
}

function createDrinkInfo(drinkProps) {

    const ingredientsUrl = 'https://www.thecocktaildb.com/images/ingredients/'
    let ingredient;
    let ingredients = [];
    let quantity;
    let i = 1;
    let isAlcoholic = (drinkProps.strAlcoholic === 'Alcoholic') ? true : false;
    do {
        ingredient = drinkProps[`strIngredient${i}`];
        quantity = drinkProps[`strMeasure${i}`]
        if (ingredient) {
            ingredients.push(new Ingredient(
                ingredient, quantity ? quantity : undefined, image = `${ingredientsUrl}${ingredient}.png`)
            );
        }
        i++
    }
    while (ingredient);
    return new DrinkContent(isAlcoholic, drinkProps.strGlass, ingredients, drinkProps.strInstructions);
}

function openMenu() {

    let table = document.getElementById('table');
    let sideBar = document.getElementById('sideBar');
    let topNav = document.getElementById('topNav');
    document.querySelectorAll('.menuOption').forEach(option => {
        option.style.display = 'block';
    })
    table.style.marginLeft = '250px';
    sideBar.style.width = '250px';
    topNav.style.marginLeft = '250px';
}

function closeMenu() {
    let table = document.getElementById('table');
    let sideBar = document.getElementById('sideBar');
    let topNav = document.getElementById('topNav');
    document.querySelectorAll('.menuOption').forEach(option => {
        option.style.display = 'none';
    })
    table.style.marginLeft = '0px';
    sideBar.style.width = '0px';
    topNav.style.marginLeft = '0px';
}

function loadMyDrinks() {
    if (!myDrinksIds.length) {
        alertWithModal('Please Add Drinks To My Drinks');
    }
    else {
        let table = document.getElementById("table");
        removeAllChilds(table);
        onDrinksInitialize(myDrinksIds.map(id => drinksMap.get(id)));
    }
}

function alertWithModal(text) {

    let modal = createDomNode('div', document.body, '', 'class', 'modal');
    let modalContent = createDomNode('div', modal, '', 'class', 'modalContent');
    let closeButton = createDomNode('span', modalContent, '&times;',
        'class', 'closeModalButton');
    let textNode = createDomNode('span', modalContent, text);
    modal.style.display = "block";
    closeButton.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            modal.remove();
        }
    }
    window.onkeyup = () => {
        modal.style.display = "none";
        modal.remove();
    }
}

function removeAllChilds(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function loadAllDrinks() {
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    onDrinksInitialize(Array.from(drinksMap.values()));
}

(function createButtonsForCategory(category) {

    getCategories().then(categories => {
        categories.forEach(category => {
            let categoriesMenu = document.getElementById('categoriesMenu');
            let button = createDomNode('button', categoriesMenu, '', 'class', 'menuOption');
            let text = createDomNode('span', button, category);
            addEventToCategoryButton(button, category);
        })
    });
})();

function toggleCategoriesList() {

    let categoriesMenu = document.getElementById('categoriesMenu');
    let arrowIcon = document.getElementById("categoriesArrow");
    if (categoriesMenu.style.display) {
        categoriesMenu.style.maxHeight = null;
        categoriesMenu.style.display = null;
        arrowIcon.setAttribute('class', 'fas fa-angle-down');
    }
    else {
        categoriesMenu.style.maxHeight = categoriesMenu.scrollHeight + 'px';
        categoriesMenu.style.display = 'block';
        arrowIcon.setAttribute('class', 'fas fa-angle-up');
    }
}

function addEventToCategoryButton(button, category) {
    button.addEventListener('click', (e) => {
        removeAllChilds(document.getElementById('table'));
        onDrinksInitialize(Array.from(drinksMap.values()).filter
            (drink => drink.category === category));
    })
}

(function handleSearchEvents() {
    let searchLine = document.getElementById('searchLine');
    let searchButton = document.getElementById("searchButton");
    searchLine.addEventListener('keyup', (e) => {
        e.preventDefault();
        if (e.keyCode === 13) {
            onSearchRequest(searchLine.value);
        }
    })
    searchButton.addEventListener('click', () => {
        onSearchRequest(searchLine.value);
    });
})();

function onSearchRequest(searchTerm) {

    let res = Array.from(drinksMap.values()).filter(drink =>
        drink.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!res.length) {
        alertWithModal('No match found');
    }
    else {
        removeAllChilds(document.getElementById('table'));
        onDrinksInitialize(res);
    }
}

