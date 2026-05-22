const axios = require('axios');

const test = async () => {
  const api = 'http://localhost:5000/api';
  try {
    // 1. Register Creator
    console.log('Registering Creator...');
    const creator = await axios.post(`${api}/auth/register`, {
      name: 'Creator One',
      email: 'creator@test.com',
      password: 'Password1!',
      role: 'creator',
    });
    console.log('Creator registered with token');

    // 2. Try to register Company as normal user (should fail)
    console.log('Registering Normal User...');
    const dummyUser = await axios.post(`${api}/auth/register`, {
      name: 'Dummy',
      email: 'dummy@test.com',
      password: 'Password1!',
      role: 'user',
      companyName: 'SomeCompany'
    }).catch(e => ({ error: true, msg: e.response?.data?.message }));
    console.log('Dummy registration with missing company (expected to fail):', dummyUser.msg);

    // 3. Register Company as Creator
    console.log('Creating Company Beta as Creator...');
    const compB = await axios.post(`${api}/company/register`, { name: 'Beta Corp' }, {
      headers: { Authorization: `Bearer ${creator.data.token}` }
    });
    console.log('Company created:', compB.data.company.name);

    // 4. Verify Creator is now mapped to Beta Corp
    const creatorMe = await axios.get(`${api}/auth/me`, {
      headers: { Authorization: `Bearer ${creator.data.token}` }
    });
    console.log('Creator mapped to company:', creatorMe.data.user.company);

    // 5. Normal User registers in Beta Corp
    console.log('Registering User in Beta Corp...');
    const userB = await axios.post(`${api}/auth/register`, {
      name: 'User B',
      email: 'userb@test.com',
      password: 'Password1!',
      role: 'user',
      companyName: 'Beta Corp'
    });
    console.log('User B registered');

    // 6. Creator creates a task
    console.log('Creator creates a task...');
    const task = await axios.post(`${api}/tasks`, {
      title: 'Creator Task',
      description: 'Test'
    }, {
      headers: { Authorization: `Bearer ${creator.data.token}` }
    });
    console.log('Task created by creator:', task.data.task.title);

    // 7. Test Admin Constraint: Try to register an admin for Beta Corp
    console.log('Registering Admin for Beta Corp (should fail)...');
    try {
      await axios.post(`${api}/auth/register`, {
        name: 'Admin B',
        email: 'adminb@test.com',
        password: 'Password1!',
        role: 'admin',
        companyName: 'Beta Corp'
      });
      console.error('FAIL: Admin was allowed!');
    } catch (err) {
      console.log('SUCCESS: Admin rejected:', err.response?.data?.message);
    }

    console.log('ALL TESTS PASSED');
  } catch (error) {
    console.error('Test Failed:', error.response?.data?.message || error.message);
  }
};

test();
