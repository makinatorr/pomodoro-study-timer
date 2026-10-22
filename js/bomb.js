// Draws the bomb-clock: the fuse burns down, the hand sweeps round and the
// blue wedge shows the time left. Coordinates match the 48x60 logo viewBox.
const CX = 24;
const CY = 38;
const R = 15.25; // inside the face's outline

function pointAt(degrees) {
  const rad = (degrees * Math.PI) / 180;
  return `${CX + R * Math.sin(rad)} ${CY - R * Math.cos(rad)}`;
}

// The wedge runs clockwise from the hand back to 12 o'clock.
function wedgePath(angle) {
  if (angle >= 360) return '';
  if (angle <= 0) {
    return `M${CX} ${CY - R} A${R} ${R} 0 1 1 ${CX} ${CY + R} A${R} ${R} 0 1 1 ${CX} ${CY - R}Z`;
  }
  const largeArc = 360 - angle > 180 ? 1 : 0;
  return `M${CX} ${CY} L${pointAt(angle)} A${R} ${R} 0 ${largeArc} 1 ${pointAt(360)}Z`;
}

// Returns a draw(progress) function for the bomb inside `wrapper`, so the
// page and the pop-out window can each draw their own copy.
// progress: 0 at the start of a phase, 1 when it runs out.
export function bombDrawer(wrapper) {
  const [fuse, spark, wedge, hand] = ['.fuse', '.spark', '.wedge', '.hand']
    .map(selector => wrapper.querySelector(selector));
  const fuseLength = fuse.getTotalLength();

  return (progress) => {
    const angle = progress * 360;
    const fuseLeft = fuseLength * (1 - progress);
    const tip = fuse.getPointAtLength(fuseLeft);

    fuse.style.strokeDasharray = `${fuseLeft} ${fuseLength}`;
    spark.setAttribute('transform', `translate(${tip.x} ${tip.y})`);
    spark.style.opacity = progress < 1 ? 1 : 0;
    hand.setAttribute('transform', `rotate(${angle} ${CX} ${CY})`);
    wedge.setAttribute('d', wedgePath(angle));
  };
}

export function explode(wrapper) {
  wrapper.classList.remove('boom');
  void wrapper.offsetWidth; // restart the CSS animation
  wrapper.classList.add('boom');
}
