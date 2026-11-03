var PI=Math.PI,TAU=PI*2,sqrt=Math.sqrt,exp=Math.exp,cos=Math.cos,sin=Math.sin,floor=Math.floor;
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function mul(a,k){return [a[0]*k,a[1]*k,a[2]*k]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function crs(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function nrm(a){var l=sqrt(dot(a,a))||1;return [a[0]/l,a[1]/l,a[2]/l]}
function lp(a,b,t){return a+(b-a)*t}
function lv(a,b,t){return [lp(a[0],b[0],t),lp(a[1],b[1],t),lp(a[2],b[2],t)]}
function ease(t){t=t<0?0:t>1?1:t;return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function perp(p,a){return nrm(sub(p,mul(a,dot(p,a))))}
function angd(a,b){var d=Math.abs(a-b)%TAU;return d>PI?TAU-d:d}
function sst(a,b,x){x=(x-a)/(b-a);x=x<0?0:x>1?1:x;return x*x*(3-2*x)}
function ik(S,W,A,B,pole){var d=sub(W,S),L=sqrt(dot(d,d)),dir=nrm(d);L=Math.min(L,(A+B)*.999);var x=(A*A-B*B+L*L)/(2*L),h=sqrt(Math.max(0,A*A-x*x)),pp=perp(pole,dir);return {E:add(S,add(mul(dir,x),mul(pp,h))),W:add(S,mul(dir,L)),pole:pp}}
/* ---------- muscle registry ---------- */
var MID={},MN=0;function mid(id){if(!MID[id])MID[id]=++MN;return MID[id]}
function mir(L){return L.map(function(l){return l.map(function(p){return [p[0],(TAU-p[1])%TAU]})})}
function fan(t0,h0,t1,h1,n,s0,s1){var o=[],j,m;for(j=0;j<n;j++){var s=n>1?j/(n-1)-.5:0,l=[];for(m=0;m<5;m++){var f=m/4;l.push([lp(t0,t1,f),lp(h0+s*s0,h1+s*s1,f)])}o.push(l)}return o}
function bi(L){return L.concat(mir(L))}
function sym(t,h,dt,dh){return [[t,h,dt,dh],[t,(TAU-h)%TAU,dt,dh]]}
/* a muscle: [id, bulge(cm), blobs[[t,theta,dt,dtheta]], fibre lines [[t,theta]...]] ; theta 0 = front, PI = back */
function mk(R,N,rows,mus,paint){
  var T={R:R,N:N},nv=(R+1)*N,nc=R*N,i,k,m,b;
  T.cs=new Float32Array(N);T.sn=new Float32Array(N);for(k=0;k<N;k++){T.cs[k]=cos(k*TAU/N);T.sn[k]=sin(k*TAU/N)}
  T.ruF=new Float32Array(R+1);T.ruB=new Float32Array(R+1);T.rv=new Float32Array(R+1);
  for(i=0;i<=R;i++){var t=i/R,j=1;while(j<rows.length-1&&t>rows[j][0])j++;var a=rows[j-1],c=rows[j],f=(t-a[0])/((c[0]-a[0])||1);f=f<0?0:f>1?1:f;T.ruF[i]=lp(a[1],c[1],f);T.ruB[i]=lp(a[2],c[2],f);T.rv[i]=lp(a[3],c[3],f)}
  T.dr=new Float32Array(nv);T.cid=new Uint8Array(nc);T.cw=new Float32Array(nc);T.gr=new Uint8Array(nc);T.tw=new Float32Array(nc);T.pt=new Uint8Array(nc);
  mus.forEach(function(M){var id=M[0],amp=M[1];
    M[2].forEach(function(bl){for(i=0;i<=R;i++)for(k=0;k<N;k++){var d=Math.pow((i/R-bl[0])/bl[2],2)+Math.pow(angd(k*TAU/N,bl[1])/bl[3],2);T.dr[i*N+k]+=amp*exp(-d*1.1)}})});
  for(i=0;i<R;i++)for(k=0;k<N;k++){var tm=(i+.5)/R,th=(k+.5)*TAU/N,best=0,bw=0;
    mus.forEach(function(M){M[2].forEach(function(bl){var d=Math.pow((tm-bl[0])/bl[2],2)+Math.pow(angd(th,bl[1])/bl[3],2),w=exp(-d*1.15);if(w>bw){bw=w;best=mid(M[0])}})});
    T.cid[i*N+k]=bw>.3?best:0;T.cw[i*N+k]=bw;
    if(paint){var pr=paint(tm,th);T.pt[i*N+k]=pr[0];T.tw[i*N+k]=pr[1]}
  }
  for(i=0;i<R;i++)for(k=0;k<N;k++){var c0=T.cid[i*N+k];T.gr[i*N+k]=(c0!==T.cid[i*N+(k+1)%N]||(i<R-1&&c0!==T.cid[(i+1)*N+k]))?1:0}
  T.fib=[];
  mus.forEach(function(M){if(M[1]<0)return;var bls=M[2];
    bls.forEach(function(bl,bi){var run=[],lines=[],x;
      function inside(t,th){for(var q=0;q<bls.length;q++){if(q===bi)continue;var b2=bls[q],d=Math.pow((t-b2[0])/b2[2],2)+Math.pow(angd(th,b2[1])/b2[3],2);if(exp(-d*1.15)>.36)return true}return false}
      for(x=0;x<=40;x++){var ang=x/40*TAU,t=bl[0]+bl[2]*.97*cos(ang),th=((bl[1]+bl[3]*.97*sin(ang))%TAU+TAU)%TAU,ok=t>.01&&t<.99&&!inside(t,th);
        if(ok)run.push([t,th]);else{if(run.length>2)lines.push(run);run=[]}}
      if(run.length>2)lines.push(run);
      lines.forEach(function(l){var p=new Float32Array(l.length*2);l.forEach(function(q,y){p[y*2]=Math.max(0,Math.min(R-.001,q[0]*R));p[y*2+1]=q[1]/TAU*N});T.fib.push({id:mid(M[0]),p:p,ol:1})})})});
  mus.forEach(function(M){(M[3]||[]).forEach(function(l){var p=new Float32Array(l.length*2);l.forEach(function(q,x){p[x*2]=Math.max(0,Math.min(R-.001,q[0]*R));p[x*2+1]=((q[1]%TAU)+TAU)%TAU/TAU*N});T.fib.push({id:mid(M[0]),p:p})})});
  T.NX=new Float32Array(nv);T.NY=new Float32Array(nv);T.NZ=new Float32Array(nv);T.VX=new Float32Array(nv);T.VY=new Float32Array(nv);T.VZ=new Float32Array(nv);T.PX=new Float32Array(nv);T.PY=new Float32Array(nv);T.PZ=new Float32Array(nv);T.vis=new Uint8Array(nc);
  return T;
}
function silOn(){for(var a=0;a<arguments.length;a++)arguments[a].sil=1}
function sphere(r,R,N){var rows=[],i;for(i=0;i<=8;i++){var t=i/8,s=sin(PI*t);rows.push([t,r*s,r*s,r*s])}return mk(R,N,rows,[],null)}
function tendP(a,b){return function(t,th){return [0,Math.max(a?sst(.10,.02,t):0,b?sst(.90,.98,t):0)]}}
/* ---------- the body ---------- */
var P7=PI/2;
var TORSO=mk(40,52,[[0,4,5,7],[.08,9,10.5,13],[.17,9.8,11.6,15.6],[.28,9,10,13.4],[.4,9,9.8,13.6],[.55,11.4,11,17],[.7,12.8,11.4,19.8],[.83,12.8,11,22],[.94,10.8,10,23],[.975,8,8,16],[1,.6,.6,.6]],[
 ["lats",3.4,sym(.5,PI-1.05,.2,.55).map(function(b){return b}).concat(sym(.68,PI-1.2,.12,.4)).concat(sym(.34,PI-.65,.12,.3)),bi(fan(.26,PI-.25,.72,PI-1.3,7,.3,.35))],
 ["trap",2.6,[[.8,PI,.15,.5],[.64,PI,.1,.28],[.9,PI,.05,.4]],fan(.6,PI,.82,PI-.75,5,.1,.3).concat(mir(fan(.6,PI,.82,PI-.75,5,.1,.3))).concat(bi(fan(.83,PI-.08,.85,PI-.85,3,.08,.1)))],
 ["rhomb",1.3,sym(.74,PI-.32,.06,.2),bi(fan(.8,PI-.1,.7,PI-.62,4,.05,.12))],
 ["infra",2.3,sym(.8,PI-.8,.07,.26),bi(fan(.77,PI-.55,.84,PI-1,4,.1,.15))],
 ["teres",2.0,sym(.75,PI-1.02,.05,.17),bi(fan(.74,PI-1.02,.78,PI-1.2,3,.06,.06))],
 ["erec",2.3,sym(.32,PI-.26,.2,.18),bi(fan(.1,PI-.26,.55,PI-.24,3,.16,.16))],
 ["spine",-1.3,[[.4,PI,.32,.07]],[]],
 ["glut",4.4,sym(.14,PI-.6,.09,.5),bi(fan(.07,PI-.06,.2,PI-1,6,.1,.3))],
 ["utrap",2.8,sym(.94,PI-.5,.05,.55),bi(fan(.9,PI-.2,.97,PI-.7,3,.1,.1))],
 ["pec",3.4,sym(.73,.55,.1,.5),bi(fan(.76,.12,.68,.9,5,.1,.2))],
 ["abs",1.8,sym(.33,.13,.17,.2),[]]
],null);
var THIGH=mk(16,26,[[0,8.8,9.4,9],[.15,10,10.6,10.2],[.5,9,9.4,9],[.85,6.8,7.2,6.8],[1,5.6,6,5.6]],[
 ["quad",2.8,[[.48,0,.3,.9],[.8,.5,.12,.3],[.8,TAU-.5,.12,.3]],fan(.1,0,.92,0,6,1,.7).concat(fan(.15,.9,.9,.45,3,.3,.2)).concat(fan(.15,TAU-.9,.9,TAU-.45,3,.3,.2))],
 ["ham",2.4,sym(.45,PI-.45,.28,.35),bi(fan(.12,PI-.45,.9,PI-.3,4,.3,.3))]
],tendP(0,1));
var SHIN=mk(14,22,[[0,5.8,6.2,5.8],[.25,6,7,6],[.45,5.6,7.6,6.2],[.8,4,4.6,4],[1,3.3,3.5,3.3]],[
 ["calf",3.8,sym(.3,PI-.42,.15,.32).concat([[.55,PI,.2,.6]]),bi(fan(.18,PI-.42,.78,PI-.08,5,.16,.1))],
 ["tib",1.3,sym(.4,.2,.25,.25),bi(fan(.15,.2,.85,.1,2,.1,.1))]
],tendP(1,1));
var UARM=mk(12,22,[[0,2.5,2.5,2.5],[.07,7.6,7.8,7.6],[.22,6.6,6.9,6.7],[.5,5.6,5.2,5.2],[1,4,4,4]],[
 ["adelt",3,[[.14,0,.1,.7]],fan(.05,0,.28,.1,4,.8,.3)],
 ["ldelt",3.2,sym(.14,P7,.1,.5),bi(fan(.05,P7,.28,P7,3,.5,.3))],
 ["rdelt",3,[[.14,PI,.1,.7]],fan(.05,PI,.3,PI,5,.9,.3)],
 ["bic",2.7,[[.52,0,.26,.5]],fan(.22,0,.85,0,3,.35,.2)],
 ["tric",2.9,[[.5,PI,.3,.6]],fan(.2,PI,.88,PI,4,.7,.3)],
 ["brach",1.3,sym(.78,.95,.12,.25),[]]
],tendP(0,1));
var FARM=mk(10,20,[[0,4.4,4.4,4.4],[.2,5.2,5.1,5.3],[.6,3.9,3.9,3.9],[1,2.7,2.7,2.7]],[
 ["fore",1.7,[[.35,0,.3,.9],[.35,PI,.3,.9]],fan(.1,0,.82,0,4,.9,.3).concat(fan(.1,PI,.82,PI,4,.9,.3))]
],tendP(1,1));
var NECK=mk(4,14,[[0,5,5.2,5],[1,4.6,4.8,4.6]],[],null);
var HEAD=mk(12,16,(function(){var r=[],i;for(i=0;i<=12;i++){var t=i/12,q=sqrt(Math.max(0,1-Math.pow(2*t-1,2)));r.push([t,8.6*q,9.2*q,7.8*q])}return r})(),[
 ["nose",1.5,[[.45,0,.07,.18]],[]],["ear",.9,sym(.5,P7,.1,.18),[]]
],function(t,th){var c=cos(th);if(t>.64||(t>.4&&c<-.25))return [2,0];if(Math.abs(t-.54)<.04&&(Math.abs(th-.59)<.06||Math.abs(th-5.69)<.06))return [3,0];return [1,0]});
var FOOT=mk(6,12,[[0,3,3.2,3],[.3,4.6,3,4.6],[.7,3.6,3,5],[1,1.6,2,3.4]],[],null);
var HIPJ=sphere(8.8,6,12),HAND=sphere(4.4,8,14),KNEE=sphere(5.6,6,12),ELB=sphere(4.2,5,10),WRI=sphere(2.9,4,8),ANK=sphere(3.4,4,8);
silOn(TORSO,THIGH,SHIN,UARM,FARM,HEAD,NECK);
var BAR=mk(1,10,[[0,1.5,1.5,1.5],[1,1.5,1.5,1.5]],[],null),PLATE=mk(1,28,[[0,11.5,11.5,11.5],[1,11.5,11.5,11.5]],[],null),HUB=mk(1,14,[[0,5,5,5],[1,5,5,5]],[],null);
/* ---------- colours ---------- */
var PAL=[{musc:[196,199,208],tend:[236,237,242],skin:[228,198,178],hair:[74,60,54],eye:[40,34,34],bar:[188,193,199],plate:[44,48,54],hub:[150,156,164],rig:[150,156,168],pad:[96,102,116],red:[214,48,42],org:[238,136,48]},
 {musc:[150,156,168],tend:[196,199,208],skin:[200,170,152],hair:[96,82,74],eye:[24,22,22],bar:[170,176,184],plate:[96,102,112],hub:[170,176,184],rig:[112,118,130],pad:[64,70,84],red:[226,58,50],org:[250,150,58]}];
var LINE=[{s:"rgba(28,32,44,.55)",n:"rgba(70,74,88,.55)",r:"rgba(112,14,12,.5)",o:"rgba(140,66,8,.45)",r2:"rgba(92,10,10,.85)",o2:"rgba(120,56,6,.8)",g2:"rgba(60,64,78,.5)"},{s:"rgba(6,8,12,.7)",n:"rgba(24,26,34,.45)",r:"rgba(100,10,8,.5)",o:"rgba(120,56,6,.45)",r2:"rgba(86,8,8,.85)",o2:"rgba(110,50,4,.8)"}];
var SC={};function sc(r,g,b){var k=((r>>2)<<12)|((g>>2)<<6)|(b>>2),s=SC[k];if(!s){s=SC[k]="rgb("+(r|0)+","+(g|0)+","+(b|0)+")"}return s}
/* ---------- draw lists ---------- */
var MAXI=9000,PTS=new Float32Array(MAXI*8+8192),Z=new Float32Array(MAXI),K=new Uint8Array(MAXI),LW=new Float32Array(MAXI),O=new Int32Array(MAXI),C=new Uint8Array(MAXI),COL=new Array(MAXI),ORD=new Int32Array(MAXI),CNT=new Int32Array(2050);
function camera(st,X){var yaw=st.yaw*PI/180,pit=st.pitch*PI/180,vw=X&&X.view,tg=vw?vw.tg:[0,80,8],dc=[-cos(yaw)*cos(pit),sin(pit),sin(yaw)*cos(pit)],f=mul(dc,-1),r=nrm(crs(f,[0,1,0])),up=crs(r,f),D=380;
  return {tg:tg,f:f,r:r,up:up,D:D,F:st.H*1.02*D/(vw?vw.span:205),cx:st.W/2,cy:st.H*.5,pos:add(tg,mul(dc,D))}}
function frame(st,X){
  var cam=camera(st,X),pal=st.dark?1:0,P=PAL[pal],LN=LINE[pal],ph=X.phase(st.t),u=ph.u,pose=X.pose(u),n=0,pp=0,under=[];
  var actR=.66+.34*u,actO=.55+.3*u,foc=null,fi,k;
  if(st.focus&&X.group[st.focus]){foc={};X.group[st.focus].forEach(function(id){foc[mid(id)]=1})}
  var inten=[],role=[];Object.keys(X.role).forEach(function(id){var q=mid(id),rr=X.role[id],m=rr?actO:actR;if(foc)m=foc[q]?1.25:m*.28;inten[q]=m;role[q]=rr});
  var tx=cam.tg[0],ty=cam.tg[1],tz=cam.tg[2],fx=cam.f[0],fy=cam.f[1],fz=cam.f[2],rx=cam.r[0],ry=cam.r[1],rz=cam.r[2],ux=cam.up[0],uy=cam.up[1],uz=cam.up[2],F=cam.F,D=cam.D,cx=cam.cx,cy=cam.cy,px0=cam.pos[0],py0=cam.pos[1],pz0=cam.pos[2];
  var L=nrm(add(add(mul(cam.f,-.55),mul(cam.up,.7)),mul(cam.r,-.45))),Hh=nrm(add(L,mul(cam.f,-1)));
  var Lx=L[0],Ly=L[1],Lz=L[2],Hx=Hh[0],Hy=Hh[1],Hz=Hh[2];
  function pj(p){var dx=p[0]-tx,dy=p[1]-ty,dz=p[2]-tz,z=dx*fx+dy*fy+dz*fz,s=F/(D+z);return [cx+(dx*rx+dy*ry+dz*rz)*s,cy-(dx*ux+dy*uy+dz*uz)*s,z]}
  function flat(pts){var o=[];pts.forEach(function(p){o.push(p[0],p[1])});return o}
  function ring(rad,cz,m,col){var a=[];for(var q=0;q<m;q++){var t=q/m*TAU;a.push(pj([cos(t)*rad,0,sin(t)*rad+cz]))}under.push({p:flat(a),c:col})}
  ring(96,4,44,st.dark?"rgba(255,255,255,.06)":"rgba(16,60,48,.08)");ring(58,4,44,st.dark?"rgba(255,255,255,.05)":"rgba(16,60,48,.07)");
  [[46,.16],[34,.14],[22,.12]].forEach(function(s){var a=[];for(var q=0;q<30;q++){var t=q/30*TAU;a.push(pj([cos(t)*s[0]*1.25,0,sin(t)*s[0]*.8+10]))}under.push({p:flat(a),c:"rgba(0,0,0,"+(st.dark?s[1]*1.5:s[1])+")"})});
  for(fi=0;fi<pose.length;fi++){
    var it=pose[fi],T=it.d,R=T.R,N=T.N,A=it.A,B=it.B,ax=nrm(sub(B,A)),uu=perp(it.u,ax),vv=crs(ax,uu),i,j,musc=it.col==="musc"||it.col==="head";
    var Ax=A[0],Ay=A[1],Az=A[2],dBx=B[0]-Ax,dBy=B[1]-Ay,dBz=B[2]-Az,uux=uu[0],uuy=uu[1],uuz=uu[2],vvx=vv[0],vvy=vv[1],vvz=vv[2],cs=T.cs,sn=T.sn;
    for(i=0;i<=R;i++){var t=i/R,Cx=Ax+dBx*t,Cy=Ay+dBy*t,Cz=Az+dBz*t,rF=T.ruF[i],rB=T.ruB[i],rV=T.rv[i];
      for(j=0;j<N;j++){var q=i*N+j,c=cs[j],s2=sn[j],d=T.dr[q],ru=(c>=0?rF:rB)+d,rv=rV+d,wx=Cx+uux*ru*c+vvx*rv*s2,wy=Cy+uuy*ru*c+vvy*rv*s2,wz=Cz+uuz*ru*c+vvz*rv*s2,dx=wx-tx,dy=wy-ty,dz=wz-tz,zz=dx*fx+dy*fy+dz*fz,sc2=F/(D+zz);
        T.VX[q]=wx;T.VY[q]=wy;T.VZ[q]=wz;T.PX[q]=cx+(dx*rx+dy*ry+dz*rz)*sc2;T.PY[q]=cy-(dx*ux+dy*uy+dz*uz)*sc2;T.PZ[q]=zz}}
    var base=P[it.col==="head"?"musc":it.col],NX=T.NX,NY=T.NY,NZ=T.NZ,VX=T.VX,VY=T.VY,VZ=T.VZ,PX=T.PX,PY=T.PY;
    NX.fill(0);NY.fill(0);NZ.fill(0);
    for(i=0;i<R;i++)for(j=0;j<N;j++){
      var j2=(j+1)%N,a=i*N+j,b=i*N+j2,c2=(i+1)*N+j2,d2=(i+1)*N+j,cell=i*N+j;
      var e1x=VX[c2]-VX[a],e1y=VY[c2]-VY[a],e1z=VZ[c2]-VZ[a],e2x=VX[d2]-VX[b],e2y=VY[d2]-VY[b],e2z=VZ[d2]-VZ[b];
      var nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x,nl=sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=nl;ny/=nl;nz/=nl;
      NX[a]+=nx;NY[a]+=ny;NZ[a]+=nz;NX[b]+=nx;NY[b]+=ny;NZ[b]+=nz;NX[c2]+=nx;NY[c2]+=ny;NZ[c2]+=nz;NX[d2]+=nx;NY[d2]+=ny;NZ[d2]+=nz;
      var mx=(VX[a]+VX[c2])*.5,my=(VY[a]+VY[c2])*.5,mz=(VZ[a]+VZ[c2])*.5;
      T.vis[cell]=(nx*(px0-mx)+ny*(py0-my)+nz*(pz0-mz)>0)?1:0}
    if(T.sil&&n<MAXI-700)for(i=0;i<R;i++)for(j=0;j<N;j++){var vv0=T.vis[i*N+j],jn=(j+1)%N,e0=-1,e1=-1;
      if(vv0!==T.vis[i*N+jn]){e0=i*N+jn;e1=(i+1)*N+jn}
      else if(i<R-1&&vv0!==T.vis[(i+1)*N+j]){e0=(i+1)*N+j;e1=(i+1)*N+jn}
      if(e0>=0){PTS[pp]=PX[e0];PTS[pp+1]=PY[e0];PTS[pp+2]=PX[e1];PTS[pp+3]=PY[e1];Z[n]=(T.PZ[e0]+T.PZ[e1])*.5-1.6;K[n]=1;LW[n]=1.5;O[n]=pp;C[n]=2;COL[n]=LN.s;pp+=4;n++}}
    for(i=0;i<R;i++)for(j=0;j<N;j++){
      var cell2=i*N+j;if(!T.vis[cell2])continue;
      var j3=(j+1)%N,a2=i*N+j,b2=i*N+j3,c3=(i+1)*N+j3,d3=(i+1)*N+j;
      var nx2=NX[a2]+NX[b2]+NX[c3]+NX[d3],ny2=NY[a2]+NY[b2]+NY[c3]+NY[d3],nz2=NZ[a2]+NZ[b2]+NZ[c3]+NZ[d3],nl2=sqrt(nx2*nx2+ny2*ny2+nz2*nz2)||1;nx2/=nl2;ny2/=nl2;nz2/=nl2;
      var r0=base[0],g0=base[1],b0=base[2],gro=1;
      if(musc){var pk=T.pt[cell2],mc=T.cid[cell2];
        if(pk===1){r0=P.skin[0];g0=P.skin[1];b0=P.skin[2]}else if(pk===2){r0=P.hair[0];g0=P.hair[1];b0=P.hair[2]}else if(pk===3){r0=P.eye[0];g0=P.eye[1];b0=P.eye[2]}
        else{var tw=T.tw[cell2];if(tw>0){var te=P.tend;r0+=(te[0]-r0)*tw;g0+=(te[1]-g0)*tw;b0+=(te[2]-b0)*tw}
          if(mc){var rl=role[mc];if(rl!==undefined){var m=sst(.22,.6,T.cw[cell2])*inten[mc],cc=rl?P.org:P.red;m=m>1?1:m;r0+=(cc[0]-r0)*m;g0+=(cc[1]-g0)*m;b0+=(cc[2]-b0)*m}
            else{var v=1+((mc%3)-1)*.02;r0*=v;g0*=v;b0*=v}}
          if(T.gr[cell2])gro=.9}}
      var lam=(.30+.58*Math.max(0,nx2*Lx+ny2*Ly+nz2*Lz)+.16*Math.max(0,-(nx2*fx+ny2*fy+nz2*fz)))*gro,hd=nx2*Hx+ny2*Hy+nz2*Hz,sp=hd>0?Math.pow(hd,16)*.06*255:0;
      var qx=(PX[a2]+PX[b2]+PX[c3]+PX[d3])*.25,qy=(PY[a2]+PY[b2]+PY[c3]+PY[d3])*.25,o=pp,E=1.12;
      PTS[o]=qx+(PX[a2]-qx)*E;PTS[o+1]=qy+(PY[a2]-qy)*E;PTS[o+2]=qx+(PX[b2]-qx)*E;PTS[o+3]=qy+(PY[b2]-qy)*E;PTS[o+4]=qx+(PX[c3]-qx)*E;PTS[o+5]=qy+(PY[c3]-qy)*E;PTS[o+6]=qx+(PX[d3]-qx)*E;PTS[o+7]=qy+(PY[d3]-qy)*E;
      Z[n]=(T.PZ[a2]+T.PZ[b2]+T.PZ[c3]+T.PZ[d3])*.25;K[n]=0;O[n]=o;C[n]=4;LW[n]=0;pp+=8;
      var rr=r0*lam+sp,gg=g0*lam+sp,bb=b0*lam+sp;COL[n]=sc(rr>255?255:rr,gg>255?255:gg,bb>255?255:bb);n++;
      if(n>=MAXI-2)break}
    /* plate faces */
    if(it.col==="plate"){[A,B].forEach(function(E2,ei){var sgn=ei?1:-1;if(sgn*(px0-E2[0])<=0)return;var o=pp,zc=pj(E2)[2];
      for(var q=0;q<28;q++){var t3=q/28*TAU,pr=pj([E2[0],E2[1]+sin(t3)*11.5,E2[2]+cos(t3)*11.5]);PTS[o+q*2]=pr[0];PTS[o+q*2+1]=pr[1]}
      var lm=.34+.66*Math.max(0,sgn*Lx),pc=P.plate;Z[n]=zc-.5;K[n]=0;LW[n]=0;O[n]=o;C[n]=28;pp+=56;COL[n]=sc(pc[0]*lm+8,pc[1]*lm+8,pc[2]*lm+10);n++})}
    /* fibre lines */
    if(musc){for(var fb=0;fb<T.fib.length;fb++){var F2=T.fib[fb],pts=F2.p,np=pts.length/2,rl2=role[F2.id],lc=rl2===undefined?LN.n:rl2?LN.o:LN.r,run=0,zs=0,o2=pp,q2;
      for(q2=0;q2<np;q2++){var fi2=pts[q2*2],fk=pts[q2*2+1],i0=floor(fi2),k0=floor(fk),k1=(k0+1)%N,fr=fi2-i0,fk2=fk-k0,v00=i0*N+k0,v01=i0*N+k1,v10=(i0+1)*N+k0,v11=(i0+1)*N+k1,ok=T.vis[v00]&&T.vis[i0*N+k1]?1:0;
        if(ok){var x=(T.PX[v00]*(1-fk2)+T.PX[v01]*fk2)*(1-fr)+(T.PX[v10]*(1-fk2)+T.PX[v11]*fk2)*fr,y=(T.PY[v00]*(1-fk2)+T.PY[v01]*fk2)*(1-fr)+(T.PY[v10]*(1-fk2)+T.PY[v11]*fk2)*fr,zq=(T.PZ[v00]*(1-fk2)+T.PZ[v01]*fk2)*(1-fr)+(T.PZ[v10]*(1-fk2)+T.PZ[v11]*fk2)*fr;
          PTS[pp]=x;PTS[pp+1]=y;pp+=2;run++;zs+=zq}
        if(!ok||q2===np-1){if(run>1&&n<MAXI-2){Z[n]=zs/run-2.2;K[n]=1;LW[n]=F2.ol?1.25:.7;O[n]=o2;C[n]=run;COL[n]=F2.ol?(rl2===undefined?(st.dark?LN.n:LN.g2):rl2?LN.o2:LN.r2):lc;n++}else pp=o2;run=0;zs=0;o2=pp}}}}
  }
  /* depth sort: counting sort, far to near */
  var zmin=1e9,zmax=-1e9,q3;for(q3=0;q3<n;q3++){if(Z[q3]<zmin)zmin=Z[q3];if(Z[q3]>zmax)zmax=Z[q3]}
  var span=(zmax-zmin)||1,NB=2048;for(q3=0;q3<=NB;q3++)CNT[q3]=0;
  for(q3=0;q3<n;q3++){var bk2=NB-1-floor((Z[q3]-zmin)/span*(NB-1));CNT[bk2+1]++}
  for(q3=1;q3<=NB;q3++)CNT[q3]+=CNT[q3-1];
  for(q3=0;q3<n;q3++){var bk3=NB-1-floor((Z[q3]-zmin)/span*(NB-1));ORD[CNT[bk3]++]=q3}
  if(st.path){var pc=st.dark?"rgba(196,245,69,.9)":"rgba(10,140,112,.9)",pa;
    X.path.forEach(function(L2,pi){var o3=pp,m3;for(m3=0;m3<L2.length;m3++){var q4=pj(L2[m3]);PTS[o3+m3*2]=q4[0];PTS[o3+m3*2+1]=q4[1]}
      Z[n]=-9999;K[n]=1;LW[n]=2.6;O[n]=o3;C[n]=L2.length;COL[n]=pc;pp+=L2.length*2;ORD[n]=n;n++})}
  return {n:n,ord:ORD,pts:PTS,off:O,cnt:C,kind:K,lw:LW,col:COL,under:under,phase:ph.p,u:u};
}
export { mk, PI, TAU, sqrt, cos, sin, add, sub, mul, lv, ease, ik, frame, TORSO, THIGH, SHIN, UARM, FARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB };
