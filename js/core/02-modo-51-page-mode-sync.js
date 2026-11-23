
(function(){
 function sync(){
  var home=document.getElementById('home'),match=document.getElementById('match');
  document.body.classList.toggle('home-mode',!!(home&&home.classList.contains('active')));
  document.body.classList.toggle('match-mode',!!(match&&match.classList.contains('active')));
 }
 sync();
 var main=document.querySelector('main')||document.body;
 if(window.MutationObserver)new MutationObserver(sync).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('click',function(){requestAnimationFrame(sync)});
 window.addEventListener('pageshow',sync);
})();
