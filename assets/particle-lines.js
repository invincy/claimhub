<head>
    <link rel="stylesheet" href="assets/style.css">
    <link rel="stylesheet" href="assets/neon.css">
</head>
<body>
    <div class="dark-bg">
        <div class="particles">
            <div class="particle-lines"></div>
            <!-- Your particles here -->
        </div>
    </div>
+   <script src="assets/particle-lines.js"></script>
</body>
document.addEventListener('DOMContentLoaded', function() {
    // Example: Add click listener to a button with id 'myButton'
    var myButton = document.getElementById('myButton');
    var particleLines = document.querySelector('.particle-lines');
    var particles = document.querySelectorAll('.particle');    function drawLines() {
        let maxDistance = 150;        let particle1 = particles[i];
                let particle2 = particles[j];

                let x1 = particle1.offsetLeft + (particle1.offsetWidth / 2);
                let y1 = particle1.offsetTop + (particle1.offsetHeight / 2);
                let x2 = particle2.offsetLeft + (particle2.offsetWidth / 2);
                let y2 = particle2.offsetTop + (particle2.offsetHeight / 2);

                let distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                if (distance < maxDistance) {
                    let line = document.createElementNS("http://www.w3.org/2000/svg", 'line');                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    particleLines.appendChild(line);
                }
            }
        }
    }

    // Create an SVG element to hold the lines
    let svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    particleLines.appendChild(svg);

    // Ensure lines are drawn on initial load
    drawLines();

    // Redraw lines every frame (or animation frame)
    function animationLoop() {
        drawLines();
        requestAnimationFrame(animationLoop);
    }

    animationLoop();
     if (myButton) {
        myButton.addEventListener('click', function() {
            alert('Button clicked!'); // Replace with your desired functionality
        });
    }
        particleLines.innerHTML = ''; // Clear previous lines
            for (let j = i + 1; j < particles.length; j++) {
                const particle1 = particles[i];
                const particle2 = particles[j];

                const x1 = particle1.offsetLeft + (particle1.offsetWidth / 2);
                const y1 = particle1.offsetTop + (particle1.offsetHeight / 2);
                const x2 = particle2.offsetLeft + (particle2.offsetWidth / 2);
                const y2 = particle2.offsetTop + (particle2.offsetHeight / 2);

                let distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                if (distance < maxDistance) {
                    let line = document.createElementNS("http://www.w3.org/2000/svg", 'line');                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    particleLines.appendChild(line);
                }
            }
        }
    }

    // Create an SVG element to hold the lines
    let svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    particleLines.appendChild(svg);

    // Ensure lines are drawn on initial load
    drawLines();

    // Redraw lines every frame (or animation frame)
    function animationLoop() {
        drawLines();
        requestAnimationFrame(animationLoop);
    }

    animationLoop();
     if (myButton) {
        myButton.addEventListener('click', function() {
            alert('Button clicked!'); // Replace with your desired functionality
        });
    }
