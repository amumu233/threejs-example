var 
    mask = document.querySelector('.mask'),
    restartBtn = document.querySelector('.restart'),
    score = document.querySelector('.score');

var game = new Game();
game.init();

restartBtn.addEventListener('click',restart);
function restart(){
    mask.style.display = 'none';
    game.restart();
}
function success(score){
    var score_current = document.querySelector('.score-current');
    score_current.innerHTML = score;
}
function failed(){
    score.innerHTML = game.score;
    mask.style.display = 'flex';
};
game.addSuccessFn(success);
game.addFailedFn(failed); 
