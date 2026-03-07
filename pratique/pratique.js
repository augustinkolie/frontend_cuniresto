let nav = document.querySelector("nav")
let nombreScroll = 0
window.addEventListener("scroll",()=>{
    if(window.scrollY > nombreScroll ){
        nav.style.top ="-44px"
    }else{
        nav.style.top="0px"
    }
    nombreScroll=window.scrollY
})

let h2 = document.getElementById("apparition")
window.addEventListener("load",()=>{
    h2.style.transform="translateX(0px)"
    h2.style.opacity="1"
})

let bnt = document.getElementById("btn-cmd")

window.addEventListener("load",()=>{
    bnt.style.transform="translateY(0px)"
    bnt.style.opacity="1"
})

let contact = document.querySelector(".form-contaire")
window.addEventListener("load",()=>{
    contact.style.transform="translateX(0)"
    contact.style.opacity="1"
})

let para = document.getElementById("para-anime")
window.addEventListener("load",()=>{
    para.style.opacity="1"
})

let inputAll = document.querySelector("input")

let titleReservation = document.querySelector("#titre-reserve")

inputAll.addEventListener("click",()=>{
    titleReservation.style.transform="translateY(0)"
    titleReservation.style.opacity ="1"
})
// let titlemenu = document.getElementById("title-menu")

// titlemenu.addEventListener("mouseenter",()=>{
//     titlemenu.style.opacity="1"
// })






