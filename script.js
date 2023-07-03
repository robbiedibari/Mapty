'use strict';

class Workout{ // Parent Class

    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration){
        this.coords = coords; // [lat, lgn]
        this.distance = distance; // in Km
        this.duration = duration; // in min
    }

    _setDescription(){
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
    ${months[this.date.getMonth()]} 
    ${this.date.getDate()}`;
    }

}

class Running extends Workout{ // Child class of Workout
    type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords,distance, duration);
        this.cadence = cadence;
        this.type = 'running'
        this.calcPace();
        this._setDescription();

    }

    calcPace(){
        // min/ Km
        this.pace = this.duration/ this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{ // Child class of Workout
    type = 'cycling';
    constructor(coords, distance, duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.type = 'cycling';
        this.calcSpeed();
        this._setDescription();

    }

    calcSpeed(){
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

 const run1 = new Running([39,-12],5.2,24,178);
 const cycle1 = new Cycling ([39,-12], 27, 95, 523);

 console.log(run1,cycle1);

/////////////////////////////////
// APPLICATION ARCHITECTURE
////////////////////////////////


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App{
    #map;
    #mapZoomLevel = 13;
    #mapEvent; // Private instance proprieties
    #workouts = [];


    constructor(){
        // Get user position
        this._getPosition();
        
        // Get data from local storage
        this._getLocalStorage();

        // Attach event handles
        form.addEventListener('submit', this._newWorkout.bind(this)); 
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPop.bind(this));
    };

    _getPosition(){
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
    alert("Cannot get your position");
        });
    
    }

    _loadMap(position){
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            console.log(`https://www/google.pt/maps/@${latitude},${longitude}`);
            
            const coords = [latitude,longitude];
             this.#map = L.map('map').setView(coords,this.#mapZoomLevel);
         
             L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
             attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             }).addTo(this.#map);
         
            
             // Handling Clicks on Map 
             this.#map.on('click', this._showForm.bind(this));
             this.#workouts.forEach(work => {
                this._renderWorkoutMarker(work);
                
            });
                 
     
    }

        _showForm(mapE){
            this.#mapEvent = mapE;
                 form.classList.remove('hidden');
                 inputDistance.focus();
        };

        _hideForm(){
            // Empty inputs 
            inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

            form.style.display = 'none';
            form.classList.add('hidden');
            setTimeout(() => form.style.display ='grid', 1000);
        }

        _toggleElevationField(){
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        }

        _newWorkout(e){

            const validInputs = (... inputs) => 
            inputs.every(inp => Number.isFinite(inp)); // every check for all the element. 
            e.preventDefault();

            const  allPositive = (...inputs) => inputs.every(inp => inp > 0);


            // Get the data from the form 
            const type = inputType.value;
            const distance = +inputDistance.value;
            const durantion = +inputDuration.value;
            const {lat,lng} = this.#mapEvent.latlng;
            let workout;
            // Check if data is valid 


            // If activity running, create running object
            if(type === 'running'){
                const cadence = +inputCadence.value;
                // Check if data is valid
                if(!validInputs(distance, durantion,cadence) || 
                   !allPositive(distance, durantion,cadence)
                   )
             return alert('Inputs have to be positive Numbers!');

            workout = new Running([lat,lng], distance, durantion, cadence);
             

            }

            // if activity is cycling, create cycling object 

            if(type === "cycling"){
                const elevation = +inputElevation.value;
                if(!validInputs(distance, durantion,elevation) || 
                    !allPositive(distance, durantion))
                 
                return alert('Inputs have to be positive Numbers!');

                workout = new Cycling([lat,lng], distance, durantion, elevation);
            }
            // add new object to workout array 
            this.#workouts.push(workout);

            // render workout on map as marker 
           this._renderWorkoutMarker(workout);

            // render workout on the list 
            this._renderWorkout(workout);

            // hide form + clear input field 
            this._hideForm();
            
            // Set Local storage to all workouts
            this._setLocalStorage();
         
            
        };

        _renderWorkoutMarker(workout){
            L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth:250,
                    minWidth:100,
                    autoClose:false,
                    closeOnClick:false,
                    className:`${workout.type}-popup`,
                })
            ).setPopupContent(`${workout.type === 'running'? '🏃' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
             
           } 

           _renderWorkout(workout){

            let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'? '🏃' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;

          if(workout.type === 'running') {
            html+= `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
         </li>
        `;
          }

          if(workout.type === 'cycling'){
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> -->
            `;
          }

          form.insertAdjacentHTML('afterend', html);
           }

           _moveToPop(e){
            const workoutEl = e.target.closest('.workout');
            console.log(workoutEl);

            if(!workoutEl)return;

            const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

            this.#map.setView(workout.coords, this.#mapZoomLevel, {
                animate:true,
                pan: {
                    duration : 1
                }
            });

            
           }


           // Should not use localStorage to use large amount of data. it will slow down your application. 
           _setLocalStorage(){
            localStorage.setItem('workouts', JSON.stringify(this.#workouts));
           };
    
           _getLocalStorage(){
            const data = JSON.parse(localStorage.getItem('workouts'));

            if(!data) return;

            this.#workouts = data;
            this.#workouts.forEach(work => {
                this._renderWorkout(work);
                
            })};
            
            reset(){
                localStorage.removeItem('workouts');
                location.reload();
            }

}
    const app = new App();




