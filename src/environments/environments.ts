// export const environment = {
//   // RH
//   apiUrl: 'http://rh.cecytem.net/api/rh',
//   loginRedirect: 'http://global.cecytem.net',
//   // GLOBAL
//   userToken: 'token',
//   user: 'user',
//   mainApiUrl: 'http://global.cecytem.net/api/global',
//   profileUrl: 'http://global.cecytem.net/global/perfil/',
// };


// export const environment = {
//   // VIATICOS
//   apiUrl: 'http://localhost:3003/viaticos',
//   loginRedirect: 'http://localhost:4200',
//   // GLOBAL
//   userToken: 'token',
//   user: 'user',
//   mainApiUrl: 'http://localhost:3000/api/global',
//   profileUrl: 'http://localhost:4200/global/perfil/',
// };

export const environment = {
  production: false,

  viaticos: {
    apiUrl: 'http://localhost:3003/viaticos/v1',
  },

  global: {
    apiUrl: 'http://localhost:3000/api/global',
    loginRedirect: 'http://localhost:4200',
    profileUrl: 'http://localhost:4200/global/perfil/',
  },

  storage: {
    tokenKey: 'viaticos_token',
    userKey: 'viaticos_user',
  },
};
