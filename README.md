# Duke@Nite Trivia

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## How to Run
To start the project, you'll need to run this one time to install packages (make sure npm is also installed):
`npm install`

Next, you'll need to create and set up the .env file. The variables here are `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_JWT_SECRET`, and `REACT_APP_CLOUDINARY_API_SECRET`. Get these from a project admin.

Now, you should be good to run the project with:
`npm start`
And the project should appear at `localhost:3000`.

## How to Deploy
Deployment is about as simple as it gets. Just connect the GitHub repo and deploy using the [Create React App Buildpack](https://github.com/mars/create-react-app-buildpack)

## Info
This project is all frontend, and uses the Firebase Realtime DB for all live communication.

Looks through `firebase.js` to understand the game logic. Basically, the host chooses a question set, then the clients join, and slowly the host advances through the rounds, with the graders grading between rounds.
