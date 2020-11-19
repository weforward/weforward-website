# 方法说明

[Weforward Framework](https://github.com/weforward/weforward-framework) 的体系中存在着方法集和方法两个概念

方法集可以简单的理解为一堆方法的集合

方法则是提供具体服务的实现

一个标准的方法如下:

```java
	@WeforwardMethod
	public String hello(FriendlyObject params) {
		String name = params.getString("name");
		return "Hello " + name + "!";
	}
```

@WeforwardMethod 注释表示这个是方法，可为外部提供服务

## 入参

方法可接受以下入参
```java
	@WeforwardMethod
	public String index(String path, Header header, Request request, Response response, DtObject params,FriendlyObject friendparams,VO voparams) {
	return "Hello," + friendparams.getString("name");
	}
```

> 入参只按类区分参数名无关，即(String path)与(String method)为同一类型入参

|参数类	|说明|					
|----|----|
|String					|方法名，如 home/index	|
|Header					|请求头					|
|Request				|请求对象				|
|Response				|响应对象				|
|DtObject				|请求参数				|
|FriendlyObject			|友好的请求参数对象		|
|VO						|值VO对象，值VO为具备一个无参构造和一堆getset方法的自定义对象|

方法入参的所有参数均为可选，即下面的方法都为合法的

```java
@WeforwardMethod
public String index1();

@WeforwardMethod
public String index2(DtObject params);

@WeforwardMethod
public String index3(FriendlyObject params);

```

当入参为值VO对象时,系统会通过无参构造创建一个值VO对象,然后调用其对象的set方法注入请求参数数据。

假设请求参数为
```json
{
    "method":"home/index",
    "params":{
        "user_name":"HelloWorld",
        "age":18,
        "level":["1","2","3"]
    }
}
```

则对象的值VO可以为
```java
public class UserView {

	protected int m_Age;
	protected String m_UserName;
	protected List<String> m_Levels;

	public UserView() {

	}

	public void setUserName(String v) {
		m_UserName = v;
	}

	public String getUserName() {
		return m_UserName;
	}

	public void setAge(int age) {
		m_Age = age;
	}

	public int getAge() {
		return m_Age;
	}

	public void setLevels(List<String> list) {
		m_Levels = list;
	}

	public List<String> getLevels() {
		return m_Levels;
	}
}

@WeforwardMethod
public String index(UserView params) {
	return "Hello," + params.getUserName();
}
```

## 返回值

方法的返回值支持以下类型
|类型	|说明	|默认值	|
|----	|----	|----	|
|short	|		|0		|
|int	|		|0		|
|long	|		|0		|
|float	|		|0		|
|double	|		|0		|
|boolean|		|false	|
|Byte	|		|null	|
|Short	|		|null	|
|Integer|		|null	|
|Long	|		|null	|
|Float	|		|null	|
|Double	|		|null	|
|Boolean|		|null	|
|String	|		|null	|
|java.math.BigInteger	|将转换成字符串格式	|null	|
|java.math.BigDecimal	|将转换成字符串格式	|null	|
|java.util.Date			|将转换成GMT时间格式表示的字串:yyyy-MM-dd’T’HH:mm:ss.SSS’Z'，如2019-10-29T00:30:00.666Z	|null	|
|Iterable				|将转换成数组	|null	|
|java.util.Iterato		|将转换成数组	|null	|
|java.util.Collection	|将转换成数组	|null	|
|java.util.Map			|将转换成对象	|null	|
|cn.weforward.common.ResultPage			|将转换成分页对象	|null	|
|VO						|值VO对象，值VO为具备一个无参构造和一堆getset方法的自定义对象|null	|
|void					|什么都不返回	|null

当返回值为值 VO对象时,系统调用对象的get方法返回参数。如下面定义的UserView为返回值是，将返回
```java
@WeforwardMethod
public UserView index(UserView params) {
	return params;
}
```

```json
{
      "user_name":"HelloWorld",
      "age":18,
      "level":["1","2","3"]
}
```

当返回值为ResultPage时，将会自动翻页，具体为
```java
Integer pageSize = tryGetInteger(params, "page_size");
if (null != pageSize) {
	rp.setPageSize(pageSize);
}
Integer page = tryGetInteger(params, "page");
if (page != null) {
	rp.gotoPage(page);
} else {
	rp.gotoPage(1);
}
```

该代码实现了接收调用端的page和page_size参数，自动处理翻转页面。 所以方法只需要直接返回ResultPage即可，不需要关心翻页
```java
@WeforwardMethod
public ResultPage<UserView> index(UserView params) {
	return ResultPageHelper.empty();
}
```

## 异常

方法可以通过抛出ApiException，提示调用端业务异常, 如:
```java
@WeforwardMethod
public void index(UserView params) throws ApiException {
	if (StringUtil.isEmpty(params.getUserName())) {
		throw new ApiException(ApiException.CODE_ILLEGAL_ARGUMENT, "用户名不能为空");
	}
}
```

```json
{
	"code":20001,
	"msg":"用户名不能为空"
}
```

方法集也可以通过实现ExceptionHandler实现处理异常，如

```java
@WeforwardMethods
public class HomeMethods implements ExceptionHandler {

	@WeforwardMethod
	public void index(UserView params) {
		if (StringUtil.isEmpty(params.getUserName())) {
			throw new NullPointerException("用户名不能为空");
		}
	}

	public Throwable exception(Throwable error) {
		if (error instanceof NullPointerException) {
			return new ApiException(ApiException.CODE_ILLEGAL_ARGUMENT, error.getMessage());
		}
		return error;
	}
}
```

如果只想处理特定异常，用可以在方法集写一个以特定异常类为入参，并返回特定异常类的方法，并加上@WeforwardWhenException即可
```java
@WeforwardMethods
public class HomeMethods {

	@WeforwardMethod
	public void index(UserView params) {
		if (StringUtil.isEmpty(params.getUserName())) {
			throw new NullPointerException("用户名不能为空");
		}
	}

	@WeforwardWhenException
	public ApiException NPE(NullPointerException error) {
		return new ApiException(ApiException.CODE_ILLEGAL_ARGUMENT, error.getMessage());
	}
}
```

## 切面

有时我们可能需要在调用方法前或调用方法后统计处理了东西，Framework提供了一些简单的拦截方法。

### Before

@WeforwardBefore 注释的方法会在执行方法前被调用，入参逻辑与@WeforwardMethod方法相同，返回值可以是void或特定的object 当返回特定的object是，将会做为下一个方法的入参注入。如：

```java
@WeforwardBefore
public UserView before(UserView params) {
	if (StringUtil.isEmpty(params.getUserName())) {
		params.setUserName("无名");
	}
	return params;
}

@WeforwardMethod
public void index(UserView params) {
	if (StringUtil.isEmpty(params.getUserName())) {
		throw new NullPointerException("用户名不能为空");
	}
}
```

### After

@WeforwardAfter 注释的方法会在执行方法后被调用，入参逻辑在@WeforwardMethod方法增加了@WeforwardMethod的返回类型 当返回特定的object是，将会做为下一个方法的入参注入，如果是最后一个方法，将作为最终的方法返回值。如：
```java
@WeforwardMethod
public String index(UserView params) {
	return "HelloWorld"
}

@WeforwardAfter
public UserView after(String name) {
	UserView view=new UserView();
	if (StringUtil.isEmpty(name)) {
		view.setUserName("无名");
	}else{
		view.setUserName(name)
	}
	return view;
}
```

## 自定义方法名

按照默认规则，方法名由方法集名称（去掉Methods结尾）+/+对应方法名称组成

如下方法名为 home/hello_world

```java
@WeforwardMethods
public class HomeMethods {

	@WeforwardMethod
	public String helloWorld() {
		return "HelloWorld";
	}
}
```

我们称呼 home为方法组，用于将各方法分组，防止名称冲突，如果不想分组，则可以在@WeforwardMethods加上root=true

如下方法名为 hello_world

```java
@WeforwardMethods(root = true)
public class HomeMethods {

	@WeforwardMethod
	public String helloWorld() {
		return "HelloWorld";
	}

}
```

如果想指定方法名称，可通过指定name=xxx 如下方法名为home/hello
```java
@WeforwardMethods
public class HomeMethods {

	@WeforwardMethod(name = "hello")
	public String helloWorld() {
		return "HelloWorld";
	}
}
```

>方法组名称同样可以自行指定

当指定的名称为Ant风格表达式时，则该方法会匹配所有符合规则的方法名。
```java
@WeforwardMethods
public class HomeMethods {

	@WeforwardMethod(name = "hello*")
	public String helloWorld() {
		return "HelloWorld";
	}
}
```

还有一种需求，就是整个服务都加上一个方法组，防止服务之间的方法名冲突。这种可以通过构造WeforwardService时指定。

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
		<constructor-arg index="3" value="/my/" />
		<property name="no" value="${weforward.serverid}" />
		<property name="servicesUrl" value="${weforward.apiUrl}" />
		<property name="accessId" value="${weforward.service.accessId}" />
		<property name="accessKey" value="${weforward.service.accessKey}" />
	</bean>
</beans>
```

配置后该项目的方法名都会加上/my/方法组前缀，如:/my/home/hello_world.

MethodsAware也同样具备相同的功能，可为自己发现的类配置上方法组

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<bean class="cn.weforward.framework.ext.MethodsAware">
		<constructor-arg ref="service" />
		<property name="basePath" value="/my/"/>
</bean>
```