# 权限验证

## 设置允许类型

微服务的凭证类型分三种

|类型		|说明					|
|----		|----					|
|无			|无任何访问凭证			|
|服务凭证	|微服务之间调用时使用		|
|用户凭证	|用户身份调用微服务时使用	|

对于每一方法集及每一方法均可指定可调用的凭证类型。

指定方法集凭证
```java
@WeforwardMethods(kind = Access.KIND_USER)
public class HomeMethods
```

指定方法凭证
```java
@WeforwardMethod(kind = Access.KIND_USER)
public String index(FriendlyObject params) {
	return "Hello," + params.getString("name");
}
```

## 设置验证器

针对三种凭证类型类型。WeforwardService类提供三个对应的方法设置验证器

```java
/**
* 设置未有凭证的验证器
*
* @param authorizer 验证器
*/
public void setNoneAuthorizer(Authorizer authorizer)

/**
* 设置服务验证器
*
* @param authorizer 验证器
*/
public void setServiceAuthorizer(Authorizer authorizer)

/**
* 设置用户验证器
*
* @param authorizer 验证器
*/
public void setUserAuthorizer(Authorizer authorizer)
```

## 功能举例

###  限制无凭证不能调用
 
```xml
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
		<property name="noneAuthorizer">
			<bean class="cn.weforward.framework.ext.OnOffAuthorizer">
				<constructor-arg value="false" />
			</bean>
		</property>
	</bean>
```

### 限制指定ip服务凭证才能调用

```xml
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
		<property name="serviceAuthorizer">
			<bean class="cn.weforward.framework.ext.IpRangesAuthorizer">
				<constructor-arg value="127.0.0.1;192.168.0.1-192.168.0.255" />
			</bean>
		</property>
	</bean>
```

### 限制用户凭证权限

```xml
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
		<property name="userAuthorizer">
			<bean class="cn.weforward.framework.ext.UserAuthorizer">
				<property name="userService" ref="userService"></property>
			</bean>
		</property>
	</bean>
```

用户验证稍微复杂一点，这里详细说明一下

首先，我们除了限制只有用户凭证才可以调用方法的同时，还需要根据方法名的不同限制不同的用户可调用 最简单的例子就是管理员与普通用户，管理员用于管理系统的方法是不允许普通用户访问的。

所以对于用户凭证，除了类型以外，还会有权限的概念。在使用UserAuthorizer时，会要求提供一个UserService 该接口一般需要自己实现。 主要需要实现下面的接口:
```java
/**
* 根据访问许可标识获取用户
*
* @param accessId 许可标识
* @return
*/
User getUserByAccess(String accessId);

```
该接口返回一个User.通过getRight可以获取该用户可以访问的方法名。

匹配模式如下：
```java
/**
* 权限URI的模式串。<br/>
* 支持通配符"*"、"**"；"*"匹配"/"以外的字符；"**"放在最后，表示匹配全部字符。
*
* <pre>
* URI样例：
* /abc/*.jspx
* /abc/**
* /abc/def/*.jspx
* /ab-*
* /ab-**
* **
* </pre>
*
*
* @return
*/
String getUriPattern();
```

通过实现以上方法，就可以限制当前用户可访问调用的方法。

由于默认需要检查用户权限，所以可能会导致一些无需权限控制的方法（如用户主页）不可访问 这里只需要配置UserAuthorizer的setIgnoreCheckRightUris指定忽略权限权限的方法即可 如:

```xml
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
		<property name="userAuthorizer">
			<bean class="cn.weforward.framework.ext.UserAuthorizer">
				<property name="userService" ref="userService"></property>
				<property name="ignoreCheckRightUris">
					<list>
						<value>home/**</value>
					</list>
				</property>
			</bean>
		</property>
	</bean>
```