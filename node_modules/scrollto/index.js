import anim from 'animated-scrollto';

/**
 * scrolls window to exact block
 * @param  {String} selector query selector where you want screen to scroll
 */
export default function (selector) {
    let element = document.querySelector(selector);
    let scrollTop = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
    anim(document.body, scrollTop, 700);
    anim(document.documentElement, scrollTop, 700);
}
