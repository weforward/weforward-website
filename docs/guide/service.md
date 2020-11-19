# 服务说明

本教程用于从零开始创建一个微服务项目，用于开发者了解微服务项目的结构，正常情况下建议通过Maven Archetype快速创建，参考>>[快速开始](server).

## 引用项目

### maven方式引入
```xml
<dependency>
	<groupId>cn.weforward</groupId>
	<artifactId>weforward-framework</artifactId>
	<version>${version}</version>
</dependency>
```
### gradle方式的引入
```groovy
dependencies {
    compile 'cn.weforward:weforward-framework:${version}'
}
```

## 配置服务入口

在/src/main/resources目录下增加weforward-endpoint-conf.xml内容如下
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:p="http://www.springframework.org/schema/p"
	xsi:schemaLocation="http://www.springframework.org/schema/beans
  http://www.springframework.org/schema/beans/spring-beans-4.3.xsd
  http://www.springframework.org/schema/context
  http://www.springframework.org/schema/context/spring-context-4.3.xsd">
	<!-- 服务 -->
	<bean id="service"
		class="cn.weforward.framework.ext.WeforwardService">
		<constructor-arg index="0" value="${weforward.name}" />
		<constructor-arg index="1" value="${weforward.host}" />
		<constructor-arg index="2" value="${weforward.port}" />
		<property name="no" value="${weforward.serverid}" />
		<property name="servicesUrl" value="${weforward.apiUrl}" />
		<property name="accessId" value="${weforward.service.accessId}" />
		<property name="accessKey" value="${weforward.service.accessKey}" />
	</bean>

</beans>
```

## 创建方法集类

```java
package cn.mytest.weforward;

import cn.weforward.framework.WeforwardMethod;
import cn.weforward.framework.WeforwardMethods;
import cn.weforward.protocol.support.datatype.FriendlyObject;

@WeforwardMethods
public class HomeMethods {

	@WeforwardMethod
	public String index(FriendlyObject params) {
		return "Hello," + params.getString("name");
	}
}
```

## 配置方法集发现

在刚刚的weforward-endpoint-conf.xml配置文件里面增加
```xml
<!-- 方法集发现 -->
<bean class="cn.weforward.framework.ext.MethodsAware">
	<constructor-arg ref="service" />
</bean>
<!-- 扫描指定包的类  -->
<context:component-scan base-package="cn.mytest.weforward" />
```

## 配置属性

经过上面的步骤，我们就可以启动项目了，但是启动时我们需要通过-D指定服务参数，太过麻烦，所以通过配置解决

在weforward-endpoint-conf.xml配置文件里面增加

```xml
<!-- 云配置 -->
<bean id="propertyConfigurer" class="cn.weforward.boot.CloudPropertyPlaceholderConfigurer"/>
```

CloudPropertyPlaceholderConfigurer会通过下面顺序加载属性

|优先级	|说明	|
|----	|----	|
|1		|通过 setLocaion设置的资源	|
|2		|classpath下面的weforward-test.properties(一般开发时使用，打包阶段将该文件排除)	|
|3		|classpath下面的weforward.properties											|																				|
|4		|Service properties(devops控制台配置的配置)									|

根据上面的优先级 我们可以先在/src/main/resources创建weforward.properties 增加以下内容

```properties
weforward.name=myweforward
```

然后在/src/main/resources创建weforward-test.properties 增加以下内容
```
project_name=myweforward

weforward.apiUrl=[网关地址]
weforward.accessId=[服务访问网关的凭证id]
weforward.accessKey=[服务访问网关的凭证key]

weforward.host=*
weforward.port=15000
```

weforward.host的值为*时，系统会自己读取当前机器的ip，如果有确定的ip也可自行指定

确定定义在 weforward还是weforward-test的方法的是考虑该属性是否环境无关 如weforward.name大部分情况下是不会变的，所以定义在weforward， 而weforward.apiUrl则可能由部署的环境决定

## 启动

### XML配置启动
我们通过运行cn.weforward.boot.SpringXmlApp的main方法类启动微服务


>如果启动时未指定weforward.serverid属性，则会默认使用x00ff.

启动后，该类会扫描classpath下格式为weforward-*-conf.xml的配置文件. 如果需要自定义格式，可通过在运行时指定-Dweforward.springconfig=xxx更改

### Java Bean配置启动
我们通过运行cn.weforward.boot.SpringAnnotationApp的main方法类启动微服务

>如果启动时未指定weforward.serverid属性，则会默认使用x00ff.

启动后，该类会读取cn.weforward.SpringConfig. 如果需要自定义类，-Dweforward.springconfig=xxx更改

> 前面步骤均为xml方式，如果要使用JavaBean方法启动需要自行修改配置