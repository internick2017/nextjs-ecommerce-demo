import React from 'react';
import {
  paramUtils,
  processParams,
  staticParamsUtils,
  paramSchemas,
  ParamsHandler,
  paramUtils as params
} from '../../../lib/paramsHandler';

// Demo component for parameter testing
const ParamsDemo = () => {
  const [testParams, setTestParams] = React.useState({
    id: '1',
    category: 'electronics',
    slug: 'laptop'
  });

  const [validationResult, setValidationResult] = React.useState<any>(null);
  const [staticParams, setStaticParams] = React.useState<any[]>([]);

  // Test parameter validation
  const testValidation = async () => {
    const handler = new ParamsHandler(paramSchemas.product);
    const result = handler.process(testParams);
    setValidationResult(result);
  };

  // Generate static parameters
  const generateStaticParams = async () => {
    const productParams = await staticParamsUtils.generateProductParams();
    const userParams = await staticParamsUtils.generateUserParams();
    const blogParams = await staticParamsUtils.generateBlogParams();
    const categoryParams = await staticParamsUtils.generateCategoryParams();

    setStaticParams([
      { type: 'Product', params: productParams },
      { type: 'User', params: userParams },
      { type: 'Blog', params: blogParams },
      { type: 'Category', params: categoryParams }
    ]);
  };

  React.useEffect(() => {
    testValidation();
    generateStaticParams();
  }, [testParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Static & Dynamic Parameters Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of parameter handling, validation, and transformation
          </p>
        </div>

        {/* Parameter Testing Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Parameter Testing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parameter Input */}
            <div>
              <h3 className="font-medium mb-3">Test Parameters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={testParams.id}
                    onChange={(e) => setTestParams(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={testParams.category}
                    onChange={(e) => setTestParams(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={testParams.slug}
                    onChange={(e) => setTestParams(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter slug"
                  />
                </div>
              </div>
            </div>

            {/* Validation Result */}
            <div>
              <h3 className="font-medium mb-3">Validation Result</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {validationResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${
                        validationResult.isValid ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className={`font-medium ${
                        validationResult.isValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {validationResult.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    {validationResult.error && (
                      <p className="text-red-600 text-sm">{validationResult.error}</p>
                    )}
                    <div className="text-sm text-gray-600">
                      <pre className="bg-white p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(validationResult.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No validation result</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Parameter Utilities Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Parameter Utilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Type Validation */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">Type Validation</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">String:</span>
                  <span className={`ml-2 ${paramUtils.validateType('test', 'string') ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validateType('test', 'string') ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Number:</span>
                  <span className={`ml-2 ${paramUtils.validateType('123', 'number') ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validateType('123', 'number') ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Boolean:</span>
                  <span className={`ml-2 ${paramUtils.validateType('true', 'boolean') ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validateType('true', 'boolean') ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pattern Validation */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">Pattern Validation</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span>
                  <span className={`ml-2 ${paramUtils.validatePattern('test@example.com', /^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validatePattern('test@example.com', /^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Numeric ID:</span>
                  <span className={`ml-2 ${paramUtils.validatePattern('123', /^\d+$/) ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validatePattern('123', /^\d+$/) ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Slug:</span>
                  <span className={`ml-2 ${paramUtils.validatePattern('my-slug', /^[a-z0-9-]+$/) ? 'text-green-600' : 'text-red-600'}`}>
                    {paramUtils.validatePattern('my-slug', /^[a-z0-9-]+$/) ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Value Transformation */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3">Value Transformation</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">To Number:</span>
                  <span className="ml-2 text-gray-600">
                    {paramUtils.transformValue('123', 'toNumber')}
                  </span>
                </div>
                <div>
                  <span className="font-medium">To Boolean:</span>
                  <span className="ml-2 text-gray-600">
                    {paramUtils.transformValue('true', 'toBoolean').toString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">To Lowercase:</span>
                  <span className="ml-2 text-gray-600">
                    {paramUtils.transformValue('HELLO', 'toLowerCase')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Static Parameters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generated Static Parameters</h2>

          <div className="space-y-6">
            {staticParams.map((paramSet, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3">{paramSet.type} Parameters</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-sm text-gray-600 overflow-auto">
                    {JSON.stringify(paramSet.params, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parameter Schemas Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Parameter Schemas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(paramSchemas).map(([name, schema]) => (
              <div key={name} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 capitalize">{name} Schema</h3>
                <div className="space-y-2 text-sm">
                  {schema.required && (
                    <div>
                      <span className="font-medium text-red-600">Required:</span>
                      <span className="ml-2 text-gray-600">{schema.required.join(', ')}</span>
                    </div>
                  )}
                  {schema.optional && (
                    <div>
                      <span className="font-medium text-blue-600">Optional:</span>
                      <span className="ml-2 text-gray-600">{schema.optional.join(', ')}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Has Validation:</span>
                    <span className="ml-2 text-gray-600">
                      {schema.validate ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Has Transformation:</span>
                    <span className="ml-2 text-gray-600">
                      {schema.transform ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example URLs Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Example URLs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Product Pages</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <code>/products/1</code>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code>/products/2?category=electronics</code>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code>/products/3?category=clothing&slug=shirt</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Blog Posts</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <code>/blog/2024/01/getting-started-nextjs-app-router</code>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code>/blog/2024/02/building-scalable-apis-nextjs</code>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code>/blog/2024/01/advanced-typescript-patterns-react</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Features Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Static Parameters</h4>
              <ul className="space-y-1">
                <li>• Pre-generated at build time</li>
                <li>• SEO optimized</li>
                <li>• Fast loading</li>
                <li>• Automatic generation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dynamic Parameters</h4>
              <ul className="space-y-1">
                <li>• Runtime validation</li>
                <li>• Type transformation</li>
                <li>• Pattern matching</li>
                <li>• Error handling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Parameter Validation</h4>
              <ul className="space-y-1">
                <li>• Required field checking</li>
                <li>• Type validation</li>
                <li>• Pattern validation</li>
                <li>• Range validation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Parameter Transformation</h4>
              <ul className="space-y-1">
                <li>• Type conversion</li>
                <li>• Value sanitization</li>
                <li>• Case transformation</li>
                <li>• Array handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParamsDemo;
