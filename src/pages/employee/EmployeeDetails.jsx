{activeTab === 'skills' && (
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Skills</h2>
            </div>
            
            {/* Skills List */}
            <div className="space-y-4">
              {employee.skills && employee.skills.length > 0 ? (
                employee.skills.map((skill) => (
                  <div key={skill.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium">{skill.name}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {skill.category ? skill.category.charAt(0).toUpperCase() + skill.category.slice(1) : 'Technical'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${skill.proficiency}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Advanced</span>
                      <span>Expert</span>
                    </div>
                    
                    {skill.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{skill.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-500">No skills added yet.</p>
                </div>
              )}
            </div>
          </div>
        )} 