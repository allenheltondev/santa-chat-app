export const config = {
	aws_project_region: process.env.NEXT_PUBLIC_region,
	Auth: {
		region: process.env.NEXT_PUBLIC_region,
		userPoolId: process.env.NEXT_PUBLIC_userpoolId,
		userPoolWebClientId: process.env.NEXT_PUBLIC_userPoolWebClientId,
		identityPoolId: process.env.NEXT_PUBLIC_identityPoolId,
    oauth: {
      domain: 'auth.justinschristmasgift.com',
      scope: [
        'email',
        'profile',
        'openid',
        //'aws.cognito.signin.user.admin'
      ],
      redirectSignIn: process.env.NEXT_PUBLIC_redirect,
      redirectSignOut: 'https://justinschristmasgift.com',
      responseType: 'code',
      redirect_uri: process.env.NEXT_PUBLIC_redirect
    }
	},
	API: {
    endpoints: [
      {
        name: 'Admin',
        endpoint: 'https://api.justinschristmasgift.com/admin'
      },
      {
        name: 'Public',
        endpoint: 'https://api.justinschristmasgift.com'
      }
    ]
  }
}
