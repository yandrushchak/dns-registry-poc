import { Admin, Resource } from 'react-admin';

import dataProvider, { Resources } from './data.provider';
import { DNSRecordsList } from './resources/dns-records/dns-records.list';
import { DNSRecordsCreate } from './resources/dns-records/dns-records.create';
import LoginPage from './login.page';
import authProvider from './auth.provider';

const App = () => (
  <Admin dataProvider={dataProvider} loginPage={LoginPage} authProvider={authProvider} requireAuth>
    <Resource
      name={Resources.DNSRecords}
      list={DNSRecordsList}
      create={DNSRecordsCreate}
      options={{ label: 'DNS Records' }}
    />
  </Admin>
);

export default App;
