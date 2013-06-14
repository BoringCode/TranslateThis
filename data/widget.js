this.addEventListener('click', function(event) {
  if(event.button === 0 && event.shiftKey === false)
    self.port.emit('left-click');
    event.preventDefault();
  if(event.button === 2)
    self.port.emit('right-click');
    event.preventDefault();
  if(event.button === 0 && event.shiftKey === true)
    self.port.emit('shift-click');
    event.preventDefault();
}, true);