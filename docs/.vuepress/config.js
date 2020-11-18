module.exports = {
	title: 'Weforward',
	description: '一套开发分布式系统的支撑框架',
	base: '/weforward-site/',
	themeConfig: {
		nav: [{
				text: '首页',
				link: '/'
			},
			{
				text: '指南',
				link: '/guide/'
			},
			{
				text: 'GitHub',
				link: 'https://github.com/weforward'
			},
		],
		sidebar: [{
				title: '服务端',
				path: '/guide/server/'
			},
			{
				title: '调用端',
				path: '/guide/client/'
			}

		]
	}
}
