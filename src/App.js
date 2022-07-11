// in src/App.js
import * as React from "react";
import { Admin, Resource } from 'react-admin';

import { UserList } from './users';
import { PostList, PostEdit, PostCreate } from './posts';
import Dashboard from './Dashboard';
import authProvider from './authProvider';

import PostIcon from '@mui/icons-material/Book';
import UserIcon from '@mui/icons-material/Group';

import dataProvider from './dataProvider';

const App = () => (
  <Admin dashboard={Dashboard} authProvider={authProvider} dataProvider={dataProvider}>
     <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate} icon={PostIcon} />
      <Resource name="users" list={UserList} icon={UserIcon} />
  </Admin>
);

export default App;