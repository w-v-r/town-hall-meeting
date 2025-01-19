import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

export class WebSocketStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // DynamoDB table to store connection IDs and presentation data
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Lambda functions for WebSocket API
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      // ... Lambda configuration
    })

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      // ... Lambda configuration
    })

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      // ... Lambda configuration
    })

    // WebSocket API
    const webSocketApi = new apigateway.WebSocketApi(this, 'WebSocketApi', {
      connectRouteOptions: { integration: new apigateway.LambdaWebSocketIntegration({ handler: connectHandler }) },
      disconnectRouteOptions: { integration: new apigateway.LambdaWebSocketIntegration({ handler: disconnectHandler }) },
      defaultRouteOptions: { integration: new apigateway.LambdaWebSocketIntegration({ handler: messageHandler }) },
    })

    // Grant permissions
    connectionsTable.grantReadWriteData(connectHandler)
    connectionsTable.grantReadWriteData(disconnectHandler)
    connectionsTable.grantReadWriteData(messageHandler)
  }
} 