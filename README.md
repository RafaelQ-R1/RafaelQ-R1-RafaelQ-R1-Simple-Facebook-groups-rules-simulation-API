
<h1>Simple-Facebook-groups-rules-simulation-API</h1>

<strong>Simple API to simulate facebook groups rules.</strong>

<h6>This API was builted following the logic of facebook groups, like:</h6>

 <ul>
 <li>
 Make groups private and only the members can see they content;
 </li>
  <li>
 List of members requesting to enter in the group;
 </li>
  <li>
 Only moderators and administrators can ban a member from a group;
  </li>
  <li>
 Groups associated to topics, topics to comments and groups, topics and comments associated to an owner;
 </li>
 </ul>
 </br>

 <h3>Main techs used in this project.</h3>
 <ul>
 <li>
 <strong>Express:<p>for server and routing.</P> </strong>
 </li>
  <li>
 <strong>Sequelize: <p>ORM for write sql querys using javascirpt and migrations generate.</P> </strong>
 </li>
  <li>
 <strong>pg and pg-hstore:<p>for data-base configuration. </P> </strong>
 </li>
  <li>
 <strong>Yup:<p>for data validation.</P> </strong>
 </li>
  <li>
 <strong>jsonwebtoken:<p>for sessions and user authentication.</P> </strong>
 </li>
 </ul>


<h3>How to use it:</h3>
<strong>- Run</strong> <code> npm install</code><strong> or </strong><code>yarn</code><strong>to install all dependencies.</strong>
</br>
<strong>- Got to</strong> <code> src/config/database.js </code> <strong> and set your own credentials.</strong>
</br>
<strong>- Or create a</strong> <code> .env </code> <strong> file </strong> <strong> and set your credentials in that file.</strong>
</br>
<strong>- Run </strong><code>yarn sequelize db:create </code> <strong> or </strong><code>npx sequelize db:create </code><strong>to create the database.</strong>
</br>
<strong>- Run </strong><code>yarn sequelize db:migrate </code> <strong> or </strong><code>npx sequelize db:migrate </code><strong>to execute the migrations.</strong>
</br>
<strong>- Run </strong><code>yarn dev </code> <strong> or </strong><code>npm run dev </code><strong>to start the server</strong>
</br>
</br>
</br>
<strong>Enjoy! 
</br>
and please, let a star in this repository. Thanks</strong>

