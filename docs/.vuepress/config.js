module.exports = {
	title: 'Weforward',
	description: '一套开发分布式系统的支撑框架',
	base: '/weforward-website/',
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
		sidebar: {
			'/guide/': getGuideSidebar('服务端', '调用端', '部署运维'),
		}
	}
}

function getGuideSidebar(groupA, groupB, groupC) {
	return [{
			title: groupA,
			collapsable: false,
			children: [
				'server',
				'service',
				'method',
				'access',
				'session',
				'resource',
				'forward',
				'storage'
			]
		},
		{
			title: groupB,
			collapsable: false,
			children: [
				'client'
			]
		},
		{
			title: groupC,
			collapsable: false,
			children: [
				'operation'
			]
		},

	]
}
