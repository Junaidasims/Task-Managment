const axios = require('axios');

const test = async () => {
  const api = 'http://localhost:5000/api';
  try {
    // 1. Register Creator
    console.log('Registering Creator...');
    const creator = await axios.post(`${api}/auth/register`, {
      name: 'Super Creator',
      email: 'supercreator@test.com',
      password: 'Password1!',
      accessCode: 'supersecretcreator',
      role: 'creator',
    });
    const creatorToken = creator.data.token;

    // 2. Create Company
    console.log('Creating Company...');
    const company = await axios.post(`${api}/company/register`, { name: 'Delta Corp' }, {
      headers: { Authorization: `Bearer ${creatorToken}` }
    });

    // 3. Update Company Name
    console.log('Updating Company Name...');
    const updatedCompany = await axios.put(`${api}/company/name`, { name: 'Delta Corp V2' }, {
      headers: { Authorization: `Bearer ${creatorToken}` }
    });
    console.log('Company updated to:', updatedCompany.data.company.name);

    // 4. Register Normal User
    console.log('Registering Normal User...');
    const user = await axios.post(`${api}/auth/register`, {
      name: 'Regular Bob',
      email: 'bob@test.com',
      password: 'Password1!',
      role: 'user',
      companyName: 'Delta Corp V2'
    });
    const userId = user.data.user.id;
    const userToken = user.data.token;

    // 5. Creator Assigns Task to Bob
    console.log('Creator assigning task to Bob...');
    const task = await axios.post(`${api}/tasks`, {
      title: 'Top Priority',
      description: 'Do this now!',
      assignedTo: userId
    }, {
      headers: { Authorization: `Bearer ${creatorToken}` }
    });
    console.log('Task assignedByCreator:', task.data.task.assignedByCreator);

    // 6. Creator Blocks Bob
    console.log('Blocking Bob...');
    await axios.put(`${api}/company/users/${userId}/block`, {}, {
      headers: { Authorization: `Bearer ${creatorToken}` }
    });

    // 7. Bob Tries to Fetch Tasks
    console.log('Bob trying to fetch tasks (should fail)...');
    try {
      await axios.get(`${api}/tasks`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.error('FAIL: Bob was able to fetch tasks while blocked!');
    } catch (err) {
      console.log('SUCCESS: Bob blocked:', err.response?.data?.message);
    }

    console.log('ALL TESTS PASSED');
  } catch (error) {
    console.error('Test Failed:', error.response?.data?.message || error.message);
  }
};

test();
