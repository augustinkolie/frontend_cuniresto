/*la bare d'humberguer*/
let menuBarre =document.querySelector("#menu-bars")
let ul = document.querySelector("ul")
menuBarre.onclick=()=>{
    menuBarre.classList.toggle("fa-times")
    ul.classList.toggle('active')
}
