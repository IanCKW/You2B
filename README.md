Orbital 2020:
Project: You2B
Team: Guanchanamobae
Latest update: June 29th 2020

*Purpose*
To allow greater control of users’ subscriber feed, we have implemented a feature that will allow you to remove videos from your feed - we are calling it the Custom Feed. This will suit those who use Youtube primarily via the subscriber feed rather than the home page and who would like a bit of control over it. An upcoming feature will be the ability to add videos from other parts of youtube(eg, the home screen) into your Custom feed.

*Running Customyfeed*
To run You2B, follow the link https://www.customyfeed.com. Enter your google account in the consent screen. The message “This app isn’t verified” will pop up. Click on “Advanced” at the bottom left. After that, approve the permissions and you will be logged in.

*Adding to the project*
If you would like to clone the code and run it yourself, do note that you will need your own Youtube API key and ouath2 account. You can find instructions here. https://dorodnic.com/blog/2018/03/24/getting-started-with-youtube-javascript-api/ and scroll to step 2. Unfortunately, you cannot run this project locally and must set up a domain due to limitations with Google’s APIs.

*Current Limitations*
As we had issues with Flask updating to v1.1, while our code is based on v1.0, we were unable to plug in our database and backend properly. Therefore, all changes made to your custom feed are saved locally on your browser. If you delete browser history, all changes you make will be lost in this iteration of the project.

*Upcoming features*
As mentioned previously, an upcoming feature will be the ability to add videos to your custom feed from other parts of youtube, eg the homepage or channel page. This will give users more control over what they can see in their custom feed.
