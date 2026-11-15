(function(){
  var lines=['Open payalapp.in','What is the weather today?','Turn on the torch','Build a website for my shop','Open WhatsApp'];
  var el=document.getElementById('cmdtxt');
  if(el){var i=0,j=0,del=false;(function tick(){
    var t=PT(lines[i]);
    if(!del){j++;el.textContent=t.slice(0,j);if(j>=t.length){del=true;return setTimeout(tick,1400);}}
    else{j--;el.textContent=t.slice(0,j);if(j<=0){del=false;i=(i+1)%lines.length;}}
    setTimeout(tick,del?30:70);})();}
  var f=document.getElementById('fdl');
  if(f){var on=function(){f.classList.toggle('on',window.scrollY>600);};
    window.addEventListener('scroll',on,{passive:true});on();}
})();
(function(){var r=document.getElementById('rot');if(!r)return;var w=['Voice','Camera','Phone','Chat'],i=0;r.textContent=PT(w[0]);setInterval(function(){i=(i+1)%w.length;r.textContent=PT(w[i]);},1800);})();
(function(){
  var C=window.PAYAL||{},end=C.offerEnds?Date.parse(C.offerEnds):NaN;
  var bar=document.getElementById('offerbar'),ll=document.getElementById('launchline'),cb=document.getElementById('cdbox');
  if(isNaN(end))return;
  function p(n){return (n<10?'0':'')+n;}
  function tick(){
    var t=end-Date.now();
    if(t<=0){document.documentElement.classList.add('offer-over');[bar,ll,cb].forEach(function(e){if(e)e.hidden=true;});return false;}
    var s=Math.floor(t/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
    var hms=(d>0?d+'d ':'')+p(h)+':'+p(m)+':'+p(x);
    Array.prototype.forEach.call(document.querySelectorAll('[data-cd]'),function(e){
      var k=e.getAttribute('data-cd');e.textContent=k==='hms'?hms:k==='d'?p(d):k==='h'?p(h):k==='m'?p(m):p(x);});
    [bar,ll,cb].forEach(function(e){if(e)e.hidden=false;});
    return true;
  }
  if(tick()){var iv=setInterval(function(){if(!tick())clearInterval(iv);},1000);}
})();
(function(){
  /* show the signed-in user in the menu, like the reference */
  var C=window.PAYAL||{},u=null;
  try{
    var ref=(C.supabaseUrl||'').replace(/^https?:\/\//,'').split('.')[0];
    var raw=localStorage.getItem('sb-'+ref+'-auth-token');
    if(raw){var j=JSON.parse(raw);u=(j&&j.user)||(j&&j.currentSession&&j.currentSession.user)||null;}
  }catch(e){}
  if(!u)return;
  var m=u.user_metadata||{},name=m.full_name||m.name||(u.email||'').split('@')[0]||'Account';
  var acct=document.getElementById('acct');if(!acct)return;
  document.getElementById('acctav').textContent=(name.charAt(0)||'A').toUpperCase();
  var an=document.getElementById('acctname');an.textContent=name;
  var col=document.createElement('span');col.className='acol';an.parentNode.insertBefore(col,an);col.appendChild(an);
  var ml=document.createElement('small');ml.className='amail';ml.textContent=u.email||'';col.appendChild(ml);acct.hidden=false;
  var d=document.getElementById('m-dash');if(d){d.textContent=PT('Dashboard');document.addEventListener('payal:lang',function(){d.textContent=PT('Dashboard');});}
  var o=document.getElementById('m-out');
  if(o){o.hidden=false;o.addEventListener('click',function(ev){ev.preventDefault();
    try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('sb-')===0)localStorage.removeItem(k);});}catch(e){}
    location.href='index.html';});}
})();

(function(){var C=window.PAYAL||{},t=C.offerEnds?Date.parse(C.offerEnds):NaN;if(isNaN(t))return;
  function put(){
    var l=window.PAYAL_LANG||'en',loc=(l==='hi'?'hi-IN':l==='bn'?'bn-IN':'en-IN')+'-u-nu-latn';
    var d=new Date(t).toLocaleDateString(loc,{day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
    var tm=new Date(t).toLocaleTimeString(loc,{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).toLowerCase();
    var txt=PT('Ends {d}, {t}').replace('{d}',d).replace('{t}',tm);
    Array.prototype.forEach.call(document.querySelectorAll('[data-endtxt]'),function(e){e.textContent=txt;});
  }
  put();document.addEventListener('payal:lang',put);})();
