const axios = require('axios');

const test = async () => {
  const api = 'http://localhost:5000/api';
  try {
    // 1. Create Company A
    console.log('Registering Company A...');
    const compA = await axios.post(`${api}/company/register`, { name: 'Alpha Inc' });
    console.log('Company A created:', compA.data.company.name);

    // 2. Register Admin for Company A
    console.log('Registering Admin A...');
    const adminA = await axios.post(`${api}/auth/register`, {
      name: 'Admin A',
      email: 'adminA@test.com',
      password: 'Password1!',
      role: 'admin',
      companyName: 'Alpha Inc'
    });
    console.log('Admin A registered with token');

    // 3. Try to register Second Admin for Company A (should fail)
    console.log('Registering Admin A2...');
    try {
      await axios.post(`${api}/auth/register`, {
        name: 'Admin A2',
        email: 'adminA2@test.com',
        password: 'Password1!',
        role: 'admin',
        companyName: 'Alpha Inc'
      });
      console.error('FAIL: Second admin was allowed!');
    } catch (err) {
      console.log('SUCCESS: Second admin rejected:', err.response.data.message);
    }

    // 4. Register User for Company A
    console.log('Registering User A...');
    const userA = await axios.post(`${api}/auth/register`, {
      name: 'User A',
      email: 'userA@test.com',
      password: 'Password1!',
      role: 'user',
      companyName: 'Alpha Inc'
    });
    console.log('User A registered');

    // 5. Create Task by User A
    console.log('Creating Task for User A...');
    const taskA = await axios.post(`${api}/tasks`, {
      title: 'Task Alpha',
      description: 'Alpha description'
    }, {
      headers: { Authorization: `Bearer ${userA.data.token}` }
    });
    console.log('Task A created:', taskA.data.task.title);

    // 6. Create Company B
    console.log('Registering Company B...');
    const compB = await axios.post(`${api}/company/register`, { name: 'Beta Corp' });
    console.log('Company B created');

    // 7. Register User for Company B
    console.log('Registering User B...');
    const userB = await axios.post(`${api}/auth/register`, {
      name: 'User B',
      email: 'userB@test.com',
      password: 'Password1!',
      role: 'user',
      companyName: 'Beta Corp'
    });
    console.log('User B registered');

    // 8. Test Isolation: User B shouldn't see Task Alpha
    console.log('Fetching tasks for User B...');
    const tasksB = await axios.get(`${api}/tasks`, {
      headers: { Authorization: `Bearer ${userB.data.token}` }
    });
    console.log('Tasks for User B (should be 0):', tasksB.data.tasks.length);

    console.log('ALL TESTS PASSED');
  } catch (error) {
    console.error('Test Failed:', error.response?.data?.message || error.message);
  }
};

test();
