# 存储

[Weforward Data](https://github.com/weforward/weforward-data)项目提供一套存储的API，方便编程使用，目前主要有persister，search，array，counter，log几个模块。

## 引用项目

### maven方式引入
```xml
<dependency>
	<groupId>cn.weforward</groupId>
	<artifactId>weforward-data</artifactId>
	<version>${version}</version>
</dependency>
```
### gradle方式的引入
```groovy
dependencies {
    compile 'cn.weforward:weforward-data:${version}'
}
```


## Persister模块

### 功能

persister实现一套业务对象的持久化接口。用于支撑业务对象的查询，保存，删除功能。

### 使用方式

1.定义一个 di(dependency interface)和它的实现类


```java
public interface OrderDi extends BusinessDi {

}

public class OrderImpl implements OrderDi {

	protected PersisterFactory m_Factory;

	public OrderImpl(PersisterFactory factory) {
		m_Factory = factory;
	}

	@Override
	public <E extends Persistent> Persister<E> getPersister(Class<E> clazz) {
		return m_Factory.getPersister(clazz);
	}

}
```

> di需要继承BusinessDi接口

2.定义业务对象

```java
public class Order extends AbstractPersistent<OrderDi> {
	@Resource
	protected int m_Amount;

	protected Order(OrderDi di) {
		super(di);//反射对象用的不能删除
	}

	public Order(OrderDi di, int amount) {
		super(di);//创建对象的方法
		genPersistenceId();// 生成id
	}

	public void submit() {
		// TODO
		markPersistenceUpdate();//标记保存对象
	}
}
```
3.定义服务并创建持久器

```java
public class OrderService extends OrderDiImpl {

	protected Persister<Order> m_PsOrder;

	public OrderService(PersisterFactory factory) {
		super(factory);
		m_PsOrder = factory.createPersister(Order.class, this);
	}

	public Order getOrder(String id) {
		return m_PsOrder.get(id);
	}

	public Order createOrder(int amount) {
		return new Order(this, amount);
	}
}
```
> Data模块没有PersisterFactory的具体实现，需参考[Weforward Data Mongodb](https://github.com/weforward/weforward-data-mongodb)实现


4.条件搜索

Persister提供一定的条件搜索支撑

单一比较的条件
```java
//相等
ps.search(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"));
//不相等
ps.search(ConditionUtil.ne(ConditionUtil.field("name"), "HelloWorld"));
//小于
ps.search(ConditionUtil.lt(ConditionUtil.field("date"), "20200808"));
//大于
ps.search(ConditionUtil.gt(ConditionUtil.field("date"), "20200808"));
//小于等于
ps.search(ConditionUtil.lte(ConditionUtil.field("date"), "20200808"));
//大于等于
ps.search(ConditionUtil.gte(ConditionUtil.field("date"), "20200808"));
```

范围查询条件
```java
ps.search(ConditionUtil.range(ConditionUtil.field("name"), "20200808", "202008089"));
```

与条件查询(全匹配)
```java
ps.search(ConditionUtil.and(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"),
				ConditionUtil.eq(ConditionUtil.field("name"), "20200808")));
```

或条件查询(有一个匹配)
```java
ps.search(ConditionUtil.or(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"),
				ConditionUtil.eq(ConditionUtil.field("name"), "20200808")));
```

上面举例的属性者是持久类的基本属性的查询，有一种情况，我们需要根据持久类的属性对象(如VO类)里面的属性查询，这时的处理如下

```java
public class Order extends AbstractPersistent<OrderDi> {
	@Resource
	protected Vo m_Vo;

	protected Order(OrderDi di) {
		super(di);//反射对象用的不能删除
	}

}

public class Vo {
	@Resource
	protected String m_Name;
}

ps.search(ConditionUtil.eq(ConditionUtil.field("m_Vo","m_Name"), "HelloWorld"));

```

5.建立索引 

条件搜索理论上支持持久类的所有属性，但是直接按这些属性条件搜索可以效率会比较低，所以我们需要对经常用来查询的属性建立索引 

```java
public class Order extends AbstractPersistent<OrderDi> {
	@Resource
	protected Vo m_Vo;

	protected Order(OrderDi di) {
		super(di);//反射对象用的不能删除
	}

}

public class Vo {
	@Index //标记索引 
	@Resource
	protected String m_Name;
}
```

有一点需要注意的是索引只会自己建议，不会自己删除，如在A上加个索引@Index，之后又将A的索引@Index去掉，些时需要人工登陆数据库将对应索引删除。


6.排序

条件查询的同时，指定排序

```java
// 正序
ps.search(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"), OrderByUtil.asc("age"));
// 倒序
ps.search(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"), OrderByUtil.desc("age"));
// 混合
ps.search(ConditionUtil.eq(ConditionUtil.field("name"), "HelloWorld"),
				OrderByUtil.unite(Arrays.asList("age"), Arrays.asList("date")));
```

## search模块

### 功能

search提供关键字搜索的功能，通过建立索引支撑各种关键字搜索

### 使用方式

1.通过工厂创建搜索器
```java
Searcher searcher = m_Factory.createSearcher("order_doc");
```
TIP: Data模块没有SearchFactory的具体实现，需参考[Weforward Data Mongodb](https://github.com/weforward/weforward-data-mongodb)实现

2.创建索引
```java
List<? extends IndexKeyword> keywords = new ArrayList<>();
keywords.add(IndexKeywordHelper.newKeyword("小额"));
keywords.add(IndexKeywordHelper.newKeyword("汽车");
keywords.add(IndexKeywordHelper.newKeyword("D:20200524"));
searcher.updateElement(IndexElementHelper.newElement("Order$123"), keywords);
```

3.单关键字匹配
```java
searcher.search(null, "汽车");
```

4.多关键字匹配
```java
searcher.search(null, "小额", "汽车");// 与关系
```

5.任意关键字匹配
```java
searcher.union(null, "小额", "汽车");// 或关系
```

6.范围匹配
```java
searcher.searchRange("D:20200524", "D:202005249", null);// 加上属性前端(如D:)后可精确匹配到属性
```
7.匹配率排序
```java
//updateElement时指定匹配率
searcher.updateElement(IndexElementHelper.newElement(UniteId.valueOf("Order$1")),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的", 1)));
searcher.updateElement(IndexElementHelper.newElement(UniteId.valueOf("Order$2")),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的", 2)));
IndexResults irs = searcher.search(SearchOption.valueOf(SearchOption.OPTION_RATE_SORT), "我们的");
//结果为order2，order1的顺序
for (IndexResult ir : ResultPageHelper.toForeach(irs)) {
	System.out.println(ir.getKey());
}
```

8.匹配率过滤
```java
//updateElement时指定匹配率	
searcher.updateElement(IndexElementHelper.newElement(UniteId.valueOf("Order$1")),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的", 1)));
searcher.updateElement(IndexElementHelper.newElement(UniteId.valueOf("Order$2")),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的", 2)));
searcher.updateElement(IndexElementHelper.newElement(UniteId.valueOf("Order$3")),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的", 3)));
//通过OPTION_RATE_LEAST指定至少匹配	
IndexResults irs = searcher.search(SearchOption.valueOf(SearchOption.OPTION_RATE_LEAST).setRate(2), "我们的");
// 结果为order2,order3
for (IndexResult ir : ResultPageHelper.toForeach(irs)) {
	System.out.println( ir.getKey());
}
```
也可按范围过滤

```java
			
IndexResults	irs = searcher.search(SearchOption.valueOf(SearchOption.OPTION_RATE_RANGE).setStartRate(1).setEndRate(2), "我们的");
// 结果为order1,order2
for (IndexResult ir : ResultPageHelper.toForeach(irs)) {
		System.out.println( ir.getKey());
}
```

9.按属性排序

```java
//updataElement时指定属性
searcher.updateElement(
				IndexElementHelper.newElement(UniteId.valueOf("Order$1"),
						Arrays.asList(IndexAttributeHelper.newAttribute("level", "1"))),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的")));
searcher.updateElement(
				IndexElementHelper.newElement(UniteId.valueOf("Order$2"),
						Arrays.asList(IndexAttributeHelper.newAttribute("level", "2"))),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的")));
searcher.updateElement(
				IndexElementHelper.newElement(UniteId.valueOf("Order$3"),
						Arrays.asList(IndexAttributeHelper.newAttribute("level", "3"))),
				Arrays.asList(IndexKeywordHelper.newKeyword("我们的")));
IndexResults irs = searcher.search(null, "我们的");
irs.sort("level", IndexResults.OPTION_ORDER_BY_DESC);
// 结果为order3，order2，order1的顺序
for (IndexResult ir : ResultPageHelper.toForeach(irs)) {
	System.out.println("场景7:" + ir.getKey());
}
```
## array模块

### 功能

array模块用于归档存储同一类数据，与数据库的结构对照大概为

* LabelSet 	 => db(数据库)
* Label    	 => table(表)
* LabelElement => row(行)

### 使用方式

1.实现LabelElement
```java
public class MyLabel implements LabelElement {
	@Resource
	protected String m_Id;
	@Resource
	protected String m_Name;

	protected MyLabel() {
		// 反射使用
	}

	public MyLabel(String id, String name) {
		m_Id = id;
		m_Name = name;
	}

	@Override
	public String getIdForLabel() {
		return m_Id;
	}

}
```
2.通过工厂创建标签集合
```java
LabelSet<MyLabel> myLabel = m_Factory.createLabelSet("mylabel", FieldMapper.valueOf(MyLabel.class));
```
> Data模块没有LabelSetFactory的具体实现，需参考[Weforward Data Mongodb](https://github.com/weforward/weforward-data-mongodb)实现

3.保存标签
```java
String label = "one";
MyLabel l = new MyLabel("123", "HelloWorld!");
myLabel.put(label, l);
label = "two";
l = new MyLabel("231", "HelloWorld!");
myLabel.put(label, l);
```

4.获取标签
```java
MyLabel l=	myLabel.get("one", "123");
```

## counter模块

### 功能

counter实现一个计数功能，通过KEY-VALUE方法保存一个关键字对应的数值，可用于人数统计，金额汇总等场景

### 使用方法

1.通过工厂创建计数器
```java
/** x00ff为服务器的标识，无固定格式，保证每一台服务器唯一即可*/
LabelCounterFactory factory = new LabelCounterFactory(labelSetFactory, "x00ff");
Counter counter = factory.createCounter("order");
```

> Data模块指定依赖LabelSetFactory的CounterFactory实现，如果有需要也可自行实现一个CounterFactory

2.计数
```java
counter.inc("Order$123");
```

3.获取值 
```java
counter.get("Order$123");
```

## 数据映射方式

数据存储通过ObjectMapper实现对象对存储数据的转换，除了自己实现一个ObjectMapper的方式，Weforward Data还提供了两种自动映射方式

### 属性映射

实现类为FieldMapper

1.使用规则

属性映射通过在类属性增加@Resource或@ResourceExt注释需要转换保存数据

> 基础类型使用@Resource即可,@ResourceExt用于集合等特殊类型

默认情况下只解析当前类的属性，如果需要保存父类属性，需要有当前类加上@Inherited

2.指定方式

  persister

继承了AbstractPersisterFactory类的PersisterFactory实现默认使用属性映射
也可通过setMapperType("field")强制指定

  array

通过在创建LabelSetHub时指定
```java
m_Factory.createLabelSet("mylabel", FieldMapper.valueOf(MyLabel.class));
```

### 方法映射

实现类为MethodMapper

1.使用规则

方法映射通过解析类的get和set方法映射，默认解析所有get和set方法（包括父类getClass()除外）

如果不想映射指定方法，可使用@Transient注释方法

* get方法标准：非静态，方法可见性public，返回类型不为void，没有入参。如：public String getName()
* set方法标准：非静态，方法可见性public，返回类型为void，有且只有一个入参。如：public void setName(String name)

另外方法同样可以使用@Resource和@Resource注解

2.指定方式

  persister

继承了AbstractPersisterFactory类可通过setMapperType("method")指定

  array

通过在创建LabelSetHub时指定
```java
m_Factory.createLabelSet("mylabel", MethodMapper.valueOf(MyLabel.class));
```

## 支持数据类型

=== 基础类型
|类型	|默认值	|
|----	|----	|
|byte	|0		|
|short	|0		|
|int	|0		|
|long	|0		|
|float	|0		|
|double	|0		|
|boolean|false	|
|Byte	|null	|
|Short	|null	|
|Integer|null	|
|Long	|null	|
|Float	|null	|
|Double	|null	|
|Boolean|null	|
|String	|null	|
|java.math.BigInteger|null|
|java.math.BigDecimal|null|

* 属性映射方式下，使用@Resource注解即可
* 方法映射方式下，不需要注解
 
### 日期

java.util.Date类

* 属性映射方式下，使用@Resource注解即可
* 方法映射方式下，不需要注解

### 数组

数组元素可以是基础类型或者VO，支持多维数组

* 属性映射方式下，使用@Resource注解即可
* 方法映射方式下，不需要注解

### 集合


属性或方法的类型可以为以下类

 - java.util.Collection
 - java.util.AbstractCollection
 - java.util.List
 - java.util.AbstractList
 - java.util.ArrayList
 - java.util.set
 - java.util.AbstractList
 - java.util.HashSet

Collection、AbstractCollection、List与AbstractList反射后的实现类为ArrayList

Set与AbstractSet反射后的实现类为HashSet

当元素是基础类型或者VO

* 属性映射方式下，使用@ResourceExt(component = xxx.class)指定元素类型
* 方法映射方式下，不需要注解 

当元素的集合又是一个集合时，不管是哪种映射方式，都需要使用ResourceExt注解，并且指定@ResourceExt(components ={ component1.class,component2.class ... componentx.class })

如:
```java
@ResourceExt(components = { List.class, String.class })
public List<List<String>> myListList;

@ResourceExt(components = { List.class, String.class })
public List<List<String>> getMyListList()

```

### 地图

属性或方法的类型可以为以下类

 - java.util.Map
 - java.util.AbstractMap
 - java.util.HashMap
 - java.util.ConcurrentMap
 - java.util.ConcurrentHashMap

Map、AbstractMap反射后的实现类为HashMap

ConcurrentMap反射后的实现类为ConcurrentHashMap

当Map的Key和Value都基础类型或者VO

* 属性映射方式下，使用@ResourceExt(components ={ key.class,value.class})指定元素类型
* 方法映射方式下，使用@ResourceExt(components ={ key.class,value.class})指定元素类型

当Value为集合时，可在components 指定下级组件类型。
如:
```java
@ResourceExt(components = { String.class, List.class, Date.class })
public Map<String, List<Date>> myMapList;

@ResourceExt(components = { String.class, List.class, Date.class })
public Map<String, List<Date>> getMyMapList()
```

> key只能是基础类型或VO

 
### 值对象（VO）

当数据类型非以上说明的几种类型时，均视为值对象(VO)

VO需要有一个入参为空的构造函数，属性或方法参数可以为所有支持数据类型。

* 属性映射方式下，使用@Resource注释VO,同时VO里面的属性也需要使用@Resource或@ResourceExt注释。
* 方法映射方式下，不需要注解，会根据VO里面的get和set方法映射。


## 自动拆装箱机制

有时候我们为了编程方便定义了一些封装对象，但保存数据时又只需要保存简单的数据类型。
这种时间就适合使用自动拆装箱机制。

> 属性映射和方法映射启动自动拆装箱机制相同


要启动自动拆装箱机制非常容易，只需要在@Resource或@ResourceExt注解时同时指定type即可

如：
```java
@Resource(type = String.class)
public UniteId myId;

@Resource(type = String.class)
public UniteId getMyId()
```

 * 拆箱规则：调用源对象的XXXValue方法转换成目标对象，如上面代码会调用 myId.stringValue()方法
 * 装箱规则：调用目标对象的valueOf(xxx)静态方法生成目标对象 ，如上面代码会调用 UniteId.valueOf(String value)方法

 
 