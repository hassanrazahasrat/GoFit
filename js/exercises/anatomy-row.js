import { PI, cos, sin, add, mul, lv, ease, ik, TORSO, THIGH, SHIN, FARM, UARM, NECK, HEAD, FOOT, HIPJ, HAND, KNEE, ELB, WRI, ANK, BAR, PLATE, HUB } from "../viewer/anatomy-engine.js";

const CYCLE=5.4;
function rowPhase(t){t=((t%CYCLE)+CYCLE)%CYCLE;
  if(t<.6)return {u:0,p:0};if(t<1.8)return {u:ease((t-.6)/1.2),p:1};if(t<2.7)return {u:1,p:2};if(t<4.9)return {u:1-ease((t-2.7)/2.2),p:3};return {u:0,p:0}}
var PATH=(function(){var e0=[],e1=[],b=[],i;for(i=0;i<=16;i++){var p=rowPose(i/16);e0.push(p.E[0]);e1.push(p.E[1]);b.push(add(p.bar,[-30,0,0]))}return [e0,e1,b]})();
var ROW_ROLE={lats:0,trap:0,rhomb:0,infra:0,teres:0,rdelt:0,bic:1,brach:1,fore:1,erec:1,glut:1,ham:1,utrap:1};
var GROUP={lats:["lats"],trap:["trap"],rhomb:["rhomb"],scap:["infra","teres"],rdelt:["rdelt"],bic:["bic","brach"],fore:["fore"],erec:["erec"],glut:["glut"],ham:["ham"],utrap:["utrap"]};
function rowPose(u){
  var lam=48*PI/180,a=[0,cos(lam),sin(lam)],ut=[0,-sin(lam),cos(lam)],P=[0,92,-15],o=[];
  function T(d,A,B,up,col){o.push({d:d,A:A,B:B,u:up,col:col||"musc"})}
  var sx=23-2.6*u,bk=.4+2.4*u,SC=add(P,mul(a,44)),sg=[1,-1],S=[],wr=[],i;
  T(TORSO,add(P,mul(a,-10)),add(P,mul(a,50)),ut);
  var hd=[0,cos(.42),sin(.42)],hu=[0,-sin(.42),cos(.42)],NB=add(P,mul(a,50));
  T(NECK,add(NB,mul(hd,-2)),add(NB,mul(hd,7)),ut);T(HEAD,add(NB,mul(hd,5)),add(NB,mul(hd,25)),hu,"head");
  var Bt=lv([0,64,21],[0,105,17.5],u);
  for(i=0;i<2;i++){var s=sg[i];S[i]=add(add(SC,[s*sx,0,0]),mul(a,-bk));
    var r=ik(S[i],add(Bt,[s*22,3,-1.5]),30,26,[s*.35,.5,-1]);
    o.E=o.E||[];o.E[i]=r.E;T(UARM,S[i],r.E,mul(r.pole,-1));T(FARM,r.E,r.W,mul(r.pole,-1));
    T(ELB,add(r.E,[0,-4.2,0]),add(r.E,[0,4.2,0]),[0,0,1],"tend");T(WRI,add(r.W,[0,-3,0]),add(r.W,[0,3,0]),[0,0,1],"tend");wr[i]=r.W}
  var by=(wr[0][1]+wr[1][1])/2-3,bz=(wr[0][2]+wr[1][2])/2+1.5;
  for(i=0;i<2;i++)T(HAND,[wr[i][0],by-3.9,bz],[wr[i][0],by+3.9,bz],[0,0,1],"tend");
  o.bar=[0,by,bz];T(BAR,[-78,by,bz],[78,by,bz],[0,1,0],"bar");
  [[52,56],[56.5,60.5]].forEach(function(p){for(var k=0;k<2;k++){var g=k?-1:1;T(PLATE,[g*p[0],by,bz],[g*p[1],by,bz],[0,1,0],"plate")}});
  for(i=0;i<2;i++)T(HUB,[sg[i]*60.4,by,bz],[sg[i]*61.2,by,bz],[0,1,0],"hub");
  for(i=0;i<2;i++){var s2=sg[i],H=add(P,[s2*9.5,-3,0]),Ak=[s2*11,9,0],r2=ik(H,Ak,44,42,[s2*.2,0,1]);
    T(HIPJ,add(H,[0,-8.8,0]),add(H,[0,8.8,0]),[0,0,1]);T(THIGH,H,r2.E,r2.pole);T(SHIN,r2.E,r2.W,r2.pole);
    T(KNEE,add(r2.E,[0,-5.6,0]),add(r2.E,[0,5.6,0]),[0,0,1],"tend");T(ANK,add(Ak,[0,-3.4,0]),add(Ak,[0,3.4,0]),[0,0,1],"tend");
    T(FOOT,add(Ak,[s2*.5,-5,-7]),add(Ak,[s2*1.5,-5,17]),[0,1,0],"tend")}
  return o;
}

export const ROW_ANATOMY = {
  label: "3D barbell row demonstration",
  cycle: CYCLE,
  phase: rowPhase,
  pose: rowPose,
  path: PATH,
  role: ROW_ROLE,
  group: GROUP,
  phases: ["Set", "Pull", "Squeeze", "Lower"],
  cues: [
    "Hinge until your torso is about 45° with a flat back. The bar hangs under your shoulders on straight arms.",
    "Pull the bar to your lower ribs. Lead with your elbows and drive them back, not forward. Keep your torso still.",
    "Squeeze your shoulder blades together and hold for a second.",
    "Lower slowly with straight arms. Do not let your back round."
  ],
  muscles: [
    ["lats", "Lats", 0],
    ["trap", "Mid & lower traps", 0],
    ["rhomb", "Rhomboids", 0],
    ["scap", "Infraspinatus & teres", 0],
    ["rdelt", "Rear delts", 0],
    ["bic", "Biceps & brachialis", 1],
    ["fore", "Forearms", 1],
    ["erec", "Lower back", 1],
    ["glut", "Glutes", 1],
    ["ham", "Hamstrings", 1],
    ["utrap", "Upper traps", 1]
  ],
  yaw: -38,
  pitch: 10
};
